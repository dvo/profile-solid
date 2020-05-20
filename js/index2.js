$(document).on('click', '.page-link', function (event) {
    event.preventDefault();
    const name = this.dataset.page;
    $('.active').removeClass('active');
    // need to make menu item active when click on inline links
    this.classList.add('active');
    $('.page').hide();
    $('.' + name + '-page').show();
    //$('.home-page-content').load(`html/${name}.html`);
    $('main').load(`html/${name}.html`);
});

$(document).ready(async function () {
    //$('.home-page-content').load(`html/gettingStarted.html`);
    $('main').load(`html/gettingStarted.html`);

    function getRandomProvider() {
        let provider = [
                    "https://inrupt.net",
                    "https://solid.community"
                ];
        var rand = Math.floor(Math.random() * provider.length);
        return provider[rand];
    }

    //$(`#provider option[value="${getRandomProvider()}"]`).attr("selected", true);

    /*function getHashParams() {
        var hashParams = {};
        var e,
            a = /\+/g, // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function (s) {
                return decodeURIComponent(s.replace(a, " "));
            },
            q = window.location.hash.substring(1);
        while (e = r.exec(q))
            hashParams[d(e[1])] = d(e[2]);
        return hashParams;
    }
    
    let hashParams = getHashParams();
    console.log(hashParams);
    if (Object.entries(hashParams).length > 0) {
        $('#viewProfile span').text('VIEW PROFILE');
        $('#viewProfile').removeClass('btn-blue');
        $('#viewProfile').addClass('btn-red');
        try {
            port = chrome.runtime.connect(laserExtensionId);
            $('.home-page-login').hide();
            $('#gun-password').show();
        } catch (e) {
            console.log(e);
        }

    }*/

    let dvoInstalled = false;
    let laserExtensionId = "bnmeokbnbegjnbddihbidleappfkiimj";
    let port = chrome.runtime.connect(laserExtensionId);
    dvoInstalled = await isDVOInstalled();
    console.log("DVO installed " + dvoInstalled);
    async function isDVOInstalled() {
        return new Promise(resolve => {
            port.postMessage({
                type: "ping"
            });
            port.onMessage.addListener(function (res) {
                console.log(res.type);
                if (res.type === "pong") {
                    resolve(true);
                }
            });
            setTimeout(function () {
                resolve(false);
            }, 2000);
        });
    }

    const session = await solid.auth.currentSession();
    if (session) {
        let fullName = await solid.data[session.webId].vcard$fn;
        let firstName = fullName.toString().split(' ');
        $('.login-status').html(`Welcome ${firstName[0]}! <a id="logout" href="">Logout</a>`);
        $('#viewProfile').css("display", "block");
        $('.home-page-login').hide();
        if (dvoInstalled) {
            $('#gun-password').show();
        } else {
            console.log(`The user doesn't have the DVO extension installed`);
        }
    }

    async function sendSessionToDVO() {
        const session = await solid.auth.currentSession();
        if (session && session.webId) {
            let pw = $('#input').val();
            if (pw === "") {
                alert(`You didn't enter anything. Please try again.`);
            } else {
                port = chrome.runtime.connect(laserExtensionId);
                port.postMessage({
                    type: "storeSolidSessionToken",
                    sessionToken: session,
                    password: pw,
                    profileUrl: window.location.host
                });
            }
        } else {
            alert(`You are not logged in. Please try again.`);
        }
    }

    async function login(idp) {
        const session = await solid.auth.currentSession();
        if (!session) {
            await solid.auth.login(idp);
        } else {
            alert(`Logged in as ${session.webId}`);
        }
    }

    $('#submit').on('click touchstart', function () {
        let provider = $("#provider").val();
        alert(provider);
        login(provider);
    });
    $('#send').click(async function () {
        sendSessionToDVO();
    });
    $('#viewProfile').on('click touchstart', async function () {
        const session = await solid.auth.currentSession();
        let url = `profile.html?webId=${session.webId}`;
        window.open(url, '_blank');
    });

    $('#logout').click(function (e) {
        solid.auth.logout();
        //localStorage.clear();
        e.preventDefault();
        localStorage.removeItem("solid-auth-client");
        port = chrome.runtime.connect(laserExtensionId);
        port.postMessage({
            type: "clearLocalStorage"
        });
        window.location = window.location.pathname
    });
})
