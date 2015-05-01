var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');

module.exports = function(app) {
	app.get('/', function (req, res) {
		
		var page = req.query.p ? parseInt(req.query.p) : 1;

		Post.getTen(null, page, function(err, posts, total){
			if(err) {
				posts = [];
			}
			res.render('index', {
				title: 'homepage',
				posts: posts,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 10 + posts.length) == total,
				user: req.session.user,				
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});						
		});
	});

	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.render('reg', {
			title: 'register',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		var name = req.body.name;
		var password = req.body.password;
		var password_re = req.body['password-repeat'];

		//check the same password has been enter twice
		if(password_re != password) {
			req.flash('error', 'passwords mismatch!');
			return res.redirect('/reg');  //return to register page
		}

		//generate md5 value of password
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});

		//check for duplicated user name
		User.get(newUser.name, function(err, user) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');  //return to home page if err happens
			}

			if(user) {
				req.flash('error', 'user name already exist!');
				return res.redirect('/reg'); //return to register page
			}

			//add new user if no duplicated user name found
			newUser.save(function(err, user){
				if(err) {
					req.flash('error', err);
					return res.redirect('/reg');  //return to register page if save fails
				}
				req.session.user = user;  //save user's information in session
				req.flash('success', 'registeration success!');
				res.redirect('/');        //redirect to home page
			});
		});
	});

    app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {
			title: 'login',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		//generate md5 value of input password
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');

		//check if valid user name input
		User.get(req.body.name, function(err, user){
			if(!user) {
				req.flash('error', 'user doesn\'t not exist!');
				return res.redirect('/login');
			}

			//check if the password match
			if(user.password != password) {
				req.flash('error', 'password mismatch!');
				return res.redirect('/login');
			}

			//save to session if password match
			req.session.user = user;
			req.flash('success', 'login success!');
			res.redirect('./');
		});
	});

	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		//res.render('post', {title: 'post'});
		res.render('post', {
			title: 'post',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user;
		var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
		var post = new Post(currentUser.name, req.body.title, tags, req.body.post);

		post.save(function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('./');
			}

			req.flash('success', 'post success');
			res.redirect('/');
		});
	});

	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', 'logout success');
		res.redirect('./');
	});

	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res) {
		res.render('upload', {
			title: 'upload files',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/upload', checkLogin);
	app.post('/upload', function(req, res) {
		req.flash('success', 'file upload success!');
		res.redirect('/upload');
	});

	app.get('/archive', function (req, res) {
	  Post.getArchive(function (err, posts) {
	    if (err) {
	      req.flash('error', err); 
	      return res.redirect('/');
	    }
	    res.render('archive', {
	      title: 'archive',
	      posts: posts,
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	  });
	});

	app.get('/tags', function (req, res) {
	  Post.getTags(function (err, posts) {
		if (err) {
		    req.flash('error', err); 
		    return res.redirect('/');
		}
	    res.render('tags', {
	      title: 'tags',
	      posts: posts,
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	  });
	});

	app.get('/tags/:tag', function (req, res) {
	  Post.getTag(req.params.tag, function (err, posts) {
	    if (err) {
	      req.flash('error',err); 
	      return res.redirect('/');
	    }
	    res.render('tag', {
	      title: 'TAG:' + req.params.tag,
	      posts: posts,
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	  });
	});

	app.get('/links', function (req, res) {
	  res.render('links', {
	    title: '友情链接',
	    user: req.session.user,
	    success: req.flash('success').toString(),
	    error: req.flash('error').toString()
	  });
	});

	app.get('/search', function (req, res) {
		Post.search(req.query.keyword, function (err, posts) {
	    if (err) {
	      req.flash('error', err); 
	      return res.redirect('/');
	    }
	    res.render('search', {
	      title: "SEARCH:" + req.query.keyword,
	      posts: posts,
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	  });
	});	

	app.get('/u/:name', function(req, res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		//check if the user exist
		User.get(req.params.name, function(err, user) {
			if(!user) {
				req.flash('error', 'user does not exist!');
				return res.redirect('/');
			}

			//search and return all artile of current user
			Post.getTen(user.name, page, function(err, posts, total) {
				if(err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					pages: page,
					isFirstPage: (page - 1) == 0,
					isLastPage: ((page - 1) * 10 + posts.length) == total,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title', function(req, res) {
		Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()				
			});
		});
	});

	app.post('/u/:name/:day/:title', function (req, res) {
	  var date = new Date(),
	      time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
	             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
	  var comment = {
	      name: req.body.name,
	      email: req.body.email,
	      website: req.body.website,
	      time: time,
	      content: req.body.content
	  };
	  var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
	  newComment.save(function (err) {
	    if (err) {
	      req.flash('error', err); 
	      return res.redirect('back');
	    }
	    req.flash('success', '留言成功!');
	    res.redirect('back');
	  });
	});

	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			res.render('edit', {
				title: 'edit',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()				
			})
		})
	});

	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function (req, res) {
	  var currentUser = req.session.user;
	  Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
		    var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
		    if (err) {
			    req.flash('error', err); 
			    return res.redirect(url);
		    }
		    req.flash('success', 'update success!');
		    res.redirect(url);
	  });
	});

	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function (req, res) {
	  var currentUser = req.session.user;
	  Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
	    if (err) {
	      req.flash('error', err); 
	      return res.redirect('back');
	    }
	    req.flash('success', 'delete success!');
	    res.redirect('/');
	  });
	});

	app.use(function (req, res) {
	  res.render("404");
	});

	function checkLogin(req, res, next) {
		if(!req.session.user) {
			req.flash('error', 'please login');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if(req.session.user) {
			req.flash('error', 'already login');
			res.redirect('back');
		}
		next();
	}
};
