const request = require('request');

window.getStats = async function (session_id, apache_token, assignment_id) {
	return new Promise(async function(resolve, reject) {

		//console.log("getting stats");
		let stats = "before";

		request.post({url:'https://aspine.us/stats', form: {session_id: session_id, apache_token: apache_token, assignment_id: assignment_id}}, 
			
			function(err, httpResponse, body){
				//console.log(err);
				//console.log(httpResponse);
				//console.log(body);
				resolve(body);
			}
		);

	});
};


//module.exports.getStats = getStats;
