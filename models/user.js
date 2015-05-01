var mongodb = require('./db');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

//save users' information
User.prototype.save = function(callback) {
	//the users' data to be saved into database
	var user = {
		name: this.name,
		password: this.password,
		email: this.email
	};

	//open database
	mongodb.open(function(err, db) {

		//if err occurs, return with err
		if(err) {
			return callback(err); 
		}

        //read users' data collection
        db.collection('users', function(err, collection) {
        	//return err if can't open data collection 'users'
        	if(err) {
        		mongodb.close();
        		return callback(err)
        	}

        	//insert users' data into data collection
        	collection.insert(user, {
        		safe: true
        	}, function (err, user) {
        		mongodb.close();
        		//return err if insert fails
        		if(err) {
        			return callback(err);
        		}

        		//if success, set err to null, and return
        		callback(null, user[0]); 
        	});

        });

	});
};

//read users' information
User.get = function(name, callback) {
	//open database first
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);  //return err if can't open database
		}

		//if open without err, then read out users' collection
		db.collection('users', function(err, collection) {
			if(err) {
				mongodb.close();      //close database connect and
				return callback(err); //return err if can't read users' collection
			}

			//search for user.name in collection
			collection.findOne({
				name: name
			}, function(err, user) {
				mongodb.close();          //close database connect
				if(err) {
					return callback(err); //return err if err happens during search
				}

				callback(null, user);     //return success with searched user's information
			});
		});
	});
};