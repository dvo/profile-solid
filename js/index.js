$(document).ready(async function () {
    if ($(window).width() < 900) $('details').removeAttr("open");

    $('main').load(`html/home.html`);
    
    let urlParams = new URLSearchParams(window.location.search);
    let page = urlParams.get('page');
    if (!page) {
        page = 'home';
    }
    // Navigation
    $('main').load(`html/${page}.html`, function () {
        $('main').css("opacity", "0.2");
        $('main').fadeTo(1000, 1);
    });
    $(document).on('click', '.page-link', function (event) {
        event.preventDefault();
        let text = $(this).text();
        $('.heading small').text(text);
        const name = this.dataset.page;
        window.history.pushState(`?page=${name}`, "Title", `?page=${name}`);
        $('nav .active').removeClass('active');
        this.classList.add('active');
        $('main').load(`html/${name}.html`, function () {
            $('main').css("opacity", "0.2");
            $('main').fadeTo(1000, 1);
        });
    });



    function getRandomProvider() {
        let provider = [
                    "https://inrupt.net",
                    "https://solid.community"
                ];
        var rand = Math.floor(Math.random() * provider.length);
        return provider[rand];
    }

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
        $('.login-status').html(`<span id="logout">LOGOUT</span><i class="fa fa-sign-out"></i>`);
        $('.welcome').html(`Welcome ${firstName[0]}!`);
        $('#view-profile').css("display", "block");
        $('#login-form').addClass("inner-shadow");
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
        login(provider);
    });
    $('#send').click(async function () {
        sendSessionToDVO();
    });
    $('#view-profile button').on('click touchstart', async function () {
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
