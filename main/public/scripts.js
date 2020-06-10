function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

var params = getHashParams();

var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

//app window template config
var windowSource = document.getElementById('player-template').innerHTML,
    windowTemplate = Handlebars.compile(windowSource),
    widnowPlaceholder = document.getElementById('app-window');


window.onSpotifyWebPlaybackSDKReady = () => {
    // You can now initialize Spotify.Player and use the SDK
}


window.addEventListener('load', function(){
    
    fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': 'Bearer ' + access_token }
}).then(function(response){

    // Define the Spotify Connect device
    var player = new Spotify.Player({
        name: 'Web Player',
        getOAuthToken: callback => {
            callback(access_token);
        },
        volume: 0.5
    });
    
    // Called when connected to the player created beforehand successfully
    player.addListener('ready', (device_id) => {
        console.log('Ready with Device ID', device_id.device_id);
    
        const play = ({
        spotify_uri,
        playerInstance: {
            _options: { getOAuthToken, id }
        }
        }) => {
        getOAuthToken(access_token => {
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [spotify_uri] }),
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                },
            });
        });
        };

        //switches web app to current playing device
        fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            body: JSON.stringify({ device_ids:[`${device_id.device_id}`] }),
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
        }).then(function(){
            updateAppWindow();
            $(document).trigger("hideLoader");
        })
        .catch(function(error){
            console.log(error);
        });

        
    }); // end ready event



    // refreshes window elements on player state change
    player.addListener('player_state_changed', (device_id) => {
        player.getCurrentState().then(state => {
            if(state != null) {
                if(Math.round(state.position) < 500 || Math.round(state.position) == Math.round(state.duration) || Math.round(state.position) == Math.round(state.duration) - 500) {
                    updateAppWindow();
                }
            }
        });
    });// end player state change event

    setInterval(updateProgressBar , 1000);

    // Connect to the player created beforehand, this is equivalent to 
    // creating a new device which will be visible for Spotify Connect
    player.connect();

    /**
    * @function
    * @name updateProgressBar - updates the progress bar every second (1000 milliseconds) by checking player status
    * @returns {void}  - void (changes elements as needed, no value returned)
    */
    function updateProgressBar(){
        player.getCurrentState().then(state => {
            if(state != null) {
                document.getElementsByClassName('progress_bar')[0].style = 'width: calc('+state.position +'% * 100 / ' +state.duration +');' 
                document.getElementById('duration').innerHTML = msToTime(state.duration);
                document.getElementById('position').innerHTML = msToTime(state.position);
            }
        });
    }

    /**
    * @function
    * @name updatedAppWindow - updates app window with current track info, player styles, ect...
    * @returns {void}  - void (changes elements as needed, no value returned)
    */
    function updateAppWindow() {
        fetch('https://api.spotify.com/v1/me/player', {
            headers: { 'Authorization': 'Bearer ' + access_token },
            dataType: 'json',
            }).then(response => response.json())
            .then(function(response) { // current player status
                widnowPlaceholder.innerHTML = windowTemplate(response);
                var img = document.getElementById('album-art');
                img.crossOrigin = "Anonymous";
    
                img.addEventListener('load', function () {
                var vibrant = new Vibrant(img);
                var swatches = vibrant.swatches();
                
                chngGrdnt(swatches['DarkMuted'] !== undefined ? swatches['DarkMuted'].getHex() : swatches['Vibrant'].getHex(),
                        swatches['DarkVibrant'] !== undefined ? swatches['DarkVibrant'].getHex() : swatches['Vibrant'].getHex(),
                        swatches['LightMuted'] !== undefined ? swatches['LightMuted'].getHex() : swatches['Vibrant'].getHex(),
                        swatches['LightVibrant'] !== undefined ? swatches['LightVibrant'].getHex() : swatches['Vibrant'].getHex(),
                        swatches['Muted'] !== undefined ? swatches['Muted'].getHex() : swatches['Vibrant'].getHex(),
                        swatches['Vibrant'] !== undefined ? swatches['Vibrant'].getHex() : swatches['LightVibrant'].getHex()
                        );
                });

                var tempo = document.createElement("div"); 
                tempo.setAttribute("id", "track-tempo");
                tempo.innerHTML = "TEMPO"
                document.getElementById("app-window").appendChild(tempo);  
    
                var span = document.createElement("span"); 
                span.setAttribute("id", "tempo");
                document.getElementById("track-tempo").appendChild(span);
    
                var energy = document.createElement("div"); 
                energy.setAttribute("id", "track-energy");
                energy.innerHTML = "ENERGY"
                document.getElementById("app-window").appendChild(energy);  
    
                var span2 = document.createElement("span2"); 
                span2.setAttribute("id", "energy");
                document.getElementById("track-energy").appendChild(span2);

                fetch('https://api.spotify.com/v1/audio-features/' +response.item.id, {
                headers: { 'Authorization': 'Bearer ' + access_token }
                }).then(audioFeatures => audioFeatures.json())
                .then(function(audioFeatures) { // audio features JSON data
                    if(audioFeatures !== undefined) {
                        document.getElementById('tempo').innerHTML = `${audioFeatures.tempo}`;
                        document.getElementById('energy'). innerHTML = `${audioFeatures.energy}`;
                    }
            });
        }).catch(function(error){
            // prone to errors because of vibrant
            // e.g. if no swatches are found will try to pass undefined as hex color value
            // not really an error as player will function with previous track's swatch values
            // console.log(error);
        });
    }

        // play-toggle handler
        playToggle = document.getElementById('play-button');
        playToggle.addEventListener("click", function(){
            player.resume().then(() => {
                playToggle.style = 'display: none;'
                pauseToggle.style = 'display: visible;'
            });
        });
    
        // pause-toggle handler
        pauseToggle = document.getElementById('pause-button');
        pauseToggle.addEventListener("click", function(){
            player.pause().then(() => {
                pauseToggle.style = 'display: none;'
                playToggle.style = 'display: visible;'
            });
        });
    
        // play next track handler
        nextTrack = document.getElementById('next-track');
        nextTrack.addEventListener("click", function(){
            player.nextTrack().then(() => {
            });
        });
    
        // play previous track handler
        previousTrack = document.getElementById('previous-track');
        previousTrack.addEventListener("click", function(){
            player.previousTrack().then(() => {
            });
        });
}) // api.spotify.com/v1/me fetch
}); // document ready

/**

 */

//renders logged in user display
if (error) {
    alert('There was an error during the authentication');
} else {
    if (access_token) {
        fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': 'Bearer ' + access_token }
        }).then(function(response){
            document.getElementById('load-anim').style.visibility = "visible";
            $('#login').hide();
            $('#loggedin').show();
        })
    } else {
        $('#login').show();
        $('#loggedin').hide();
    }
}


/**
* @function
* @name getRandomInt - calculates random int
* @param {int} max - roof of random number to be generated
* @returns {int} - returns random integer between 0 - {max}
*/
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}


/**
* @function
* @name msToTime - converts ms to time format
* @param {int} s - milliseconds to be formatted
* @returns {string} - returns string formatted into a time format (00:00)
*/
function msToTime(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = ("0" +(s % 60)).slice(-2);
    s = (s - secs) / 60;
    var mins = ("0" +(s % 60)).slice(-2);
    return mins + ':' + secs;
}


/**
* @function
* @name chngGrdnt - updates gradient background and colored html elements
* @param {string} darkMuted - darkMuted color swatch of album-art html element as returned by virbant.js
* @param {string} darkVibrant - darkVibrant color swatch of album-art html element as returned by virbant.js
* @param {string} lightMuted - lightMuted color swatch of album-art html element as returned by virbant.js
* @param {string} lightVibrant - lightVibrant color swatch of album-art html element as returned by virbant.js
* @param {string} muted - muted color swatch of album-art html element as returned by virbant.js
* @param {string} vibrant - Vibrant color swatch of album-art html element as returned by virbant.js
* @returns {void}  - void (changes elements as needed, no value returned)
*/
function chngGrdnt(darkMuted, darkVibrant, lightMuted, lightVibrant, muted, vibrant) {
    // background color update
    if(lightMuted !== undefined && vibrant !== undefined && darkVibrant !== undefined) {
        document.getElementsByClassName('grd-bg')[1].style = `background-image: linear-gradient(-45deg, ${darkVibrant}, ${muted}, ${vibrant});`
    } else {
        document.getElementsByClassName('grd-bg')[1].style = `background-image: linear-gradient(-45deg, ${muted}, ${darkMuted}, ${vibrant});`
    }

    // player color update
    var play = document.getElementsByClassName('play-fill');

    for(element of play){
        element.style = `fill: ${darkVibrant};`
    }

    var pause = document.getElementsByClassName('pause-fill');
    for(element of pause) {
        element.style = `fill: ${darkVibrant};`
    }
    document.getElementsByClassName('progress')[0].style = `border: 0.1em solid ${darkVibrant};`
    document.getElementById('bar-fill').style = `background-color: ${darkVibrant};`
    document.getElementById('track-name').style = `background-color: ${vibrant};`
    document.getElementById('track-artist-album').style = `background-color: ${vibrant};`
    document.getElementById('grid-cover').style = `fill: ${vibrant};`
    document.getElementById('tempo').style = `background-color: ${vibrant};`
    document.getElementById('energy').style = `background-color: ${vibrant};`

    // confetti
    var confetti = document.getElementsByClassName('confetti');
    for(x of confetti) {
        var randm = getRandomInt(4);
        switch(randm){
            case 0:
                darkMuted !== undefined ? x.style = `stroke: ${darkMuted}` : x.style = `stroke: ${vibrant}`
                break; 
            case 1:
                x.style = `stroke: ${darkVibrant}`;
                darkVibrant !== undefined ? x.style = `stroke: ${darkVibrant}` : x.style = `stroke: ${vibrant}`
                break; 
            case 2:
                x.style = `stroke: ${lightMuted}`;
                lightMuted !== undefined ? x.style = `stroke: ${lightMuted}` : x.style = `stroke: ${vibrant}`
                break;  
            case 3:
                x.style = `stroke: ${lightVibrant}`;
                lightVibrant !== undefined ? x.style = `stroke: ${lightVibrant}` : x.style = `stroke: ${vibrant}`
                break;  
            case 4:
                x.style = `stroke: ${muted}`;
                muted !== undefined ? x.style = `stroke: ${muted}` : x.style = `stroke: ${vibrant}`
                break;  
            default: 
                x.style = `stroke: ${vibrant}`;
                vibrant !== undefined ? x.style = `stroke: ${vibrant}` : x.style = `stroke: ${muted}`
                break;  
        }
        
    }
}

$(document).on("hideLoader", function () {
    var state = document.readyState
    if (state == 'interactive') {
            document.getElementById('loggedin').style.visibility = "hidden";
    } else if (state == 'complete') {
            document.getElementById('loggedin').style.visibility = "visible";
            $('#load-anim').fadeOut(1200);
    }
});