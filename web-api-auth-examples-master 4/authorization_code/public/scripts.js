(function() {

    /**
     * Obtains parameters from the hash of the URL
     * @return Object
     */
    function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
        while ( e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    }


    //user panel template config
    var userPanelSource = document.getElementById('user-panel-template').innerHTML,
        userPanelTemplate = Handlebars.compile(userPanelSource),
        userPanelPlaceholder = document.getElementById('user-panel');

    //app window template config
    var windowSource = document.getElementById('player-template').innerHTML,
        windowTemplate = Handlebars.compile(windowSource),
        widnowPlaceholder = document.getElementById('app-window');

    var params = getHashParams();

    var access_token = params.access_token,
        refresh_token = params.refresh_token,
        error = params.error;

    //spotify API work
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': 'Bearer ' + access_token }
    })
    .then((response) => response.json())
    .then(function(data) {
        var id = data.item.id;
        widnowPlaceholder.innerHTML = windowTemplate(data);
    }).catch(function(error){
        console.log(error);
    });



    //giphy API work
    fetch('http://api.giphy.com/v1/gifs/search?q=anime+aesthetic&offset='+getRandomInt(1000) +'&' +'api_key=' +'dc6zaTOxFJmzC')
    .then((response) => response.json())
    .then(function(data) {
        setBG();

        //recursively searches for image with BG size < 300px and sets first occurence
        function setBG() {
            index = getRandomInt(data.data.length);
            imageHeight = data.data[index].images.original.height;

            if(imageHeight < 300){
                setBG();
            } else {
                if(document.getElementById('loggedin').style.visibility = 'none') {
                    document.getElementById('bg-image').src = data.data[index].images.original.webp;
                    
                } else {
                    console.log('fire');
                    document.getElementsByClassName('bg').src = data.data[index].images.original.webp;
                    
                }
            }
            return;
        }
    }).catch(function(error){
        console.log(error);
    });

    //returns a random int
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }




    //renders logged in user display
    if (error) {
        alert('There was an error during the authentication');
    } else {
        if (access_token) {

            //rewrite as fetch
        $.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function(response) {
                $('#login').hide();
                $('#loggedin').show();
            }
        });
        } else {
            // render initial screen
            $('#login').show();
            $('#loggedin').hide();
        }
    }
})();