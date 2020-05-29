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

//renders logged in user display
if (error) {
    alert('There was an error during the authentication');
} else {
    if (access_token) {
        fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': 'Bearer ' + access_token }
        }).then(function(response){
            $('#login').hide();
            $('#loggedin').show();
            playerInit(access_token);

            // Define the Spotify Connect device
            var player = new Spotify.Player({
                name: 'A Spotify Web SDK Player',
                getOAuthToken: callback => {
                    callback(access_token);
                },
                volume: 0.5
            });

            // Called when connected to the player created beforehand successfully
            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                

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
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                    });
                });
                };

                //intializes player with last playing song in spotify player
                fetch('https://api.spotify.com/v1/me/player', {
                headers: { 'Authorization': 'Bearer ' + access_token }
                })
                .then((response) => response.json())
                .then(function(data) {
                    console.log(data);
                    play({
                        playerInstance: player,
                        spotify_uri: `spotify:track:${data.item.id}`,
                    });
                }).catch(function(error){
                    console.log(error);
                });

                
                
        });

        player.addListener('player_state_changed', (device_id) => {
            console.log('Currently Playing', device_id.track_window.current_track.name);
            console.log('Position in Song', device_id.position);
            console.log('Duration of Song', device_id.duration);
            widnowPlaceholder.innerHTML = windowTemplate(device_id);

            //var t = setInterval(runFunction , 1000);

                //function runFunction(){
                //    console.log('change!');

                    //document.getElementById('testSel').stlye = 'width: calc(' +(device_id.position) +'% * 100 / '+(device_id.duration)+');'
                //}

            //sets giphy bg
            fetch('http://api.giphy.com/v1/gifs/search?q=anime+aesthetic&offset='+getRandomInt(1000) +'&' +'api_key=' +'dc6zaTOxFJmzC')
            .then(response => response.json())
            .then(function(data){
                setBG(data);
            })
        });
        
        // Connect to the player created beforehand, this is equivalent to 
        // creating a new device which will be visible for Spotify Connect
        player.connect();
        
        })
        } else {
            // render initial screen
            $('#login').show();
            $('#loggedin').hide();
        }
}


//user panel template config
var userPanelSource = document.getElementById('user-panel-template').innerHTML,
    userPanelTemplate = Handlebars.compile(userPanelSource),
    userPanelPlaceholder = document.getElementById('user-panel');

//app window template config
var windowSource = document.getElementById('player-template').innerHTML,
    windowTemplate = Handlebars.compile(windowSource),
    widnowPlaceholder = document.getElementById('app-window');

function playerInit(access_token){

    /**
    //spotify API work
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': 'Bearer ' + access_token }
    })
    .then((response) => response.json())
    .then(function(data) {
        var id = data.item.id;
        //widnowPlaceholder.innerHTML = windowTemplate(data);
    }).catch(function(error){
        console.log(error);
    });

    **/
    //giphy API work
    fetch('http://api.giphy.com/v1/gifs/search?q=anime+aesthetic&offset='+getRandomInt(200) +'&' +'api_key=' +'dc6zaTOxFJmzC')
    .then((response) => response.json())
    .then(function(data) {
        setBG(data);
    }).catch(function(error){
        console.log(error);
    });
}//player init function

//returns a random int
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

//recursively searches for image with BG size < 300px and sets first occurence
function setBG(data) {
    index = getRandomInt(data.data.length);
    imageHeight = data.data[index].images.original.height;

    if(imageHeight < 300){
        setBG(data);
    } else {
        var elements = document.getElementsByClassName('bg');
        for(var i = 0; i < elements.length; i++){
            elements[i].src = data.data[index].images.original.webp;
        }
    }
    return;
}