const request = require('request');

window.getStats = async function (session_id, apache_token, assignment_id) {
    return new Promise(async function(resolve, reject) {
        request.post(
            {
                url: window.location.origin + "/stats",
                // https://stackoverflow.com/a/406208
                form: {session_id: session_id, apache_token: apache_token,
                       assignment_id: assignment_id}
            },
            (err, httpResponse, body) => resolve(body)
        );
    });
}

//module.exports.getStats = getStats;
