const express = require('express');
const database = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = database.createConnection({
    host: 'localhost',
    user: 'test',
    password: 'testing',
    database: 'uph'
});
const http = express();

http.use(session({
  secret: 'rahasia',
  resave: false,
  saveUninitialized: true
}))

function dbQuery(db, query, params) {
    const promise = new Promise(function(resolve, reject) {
        db.query(query, params, function(err, results, fields) {
            if (err)
                reject(err);
            else
                resolve(results, fields);
        });
    });
    return promise;
}


http.use(bodyParser.urlencoded({ extended: false }))
http.use(bodyParser.json())

http.use((req, res, next) => {
    if (! req.session.flash)
        req.session.flash = [];

    next();
});

// var index = require("./routes/index");

http.set('view engine', 'ejs');
http.set('views', 'views');

const n = 2;


http.get('/', (req, res) => {
    // pagination
    const page = parseInt(req.query.page ? req.query.page : 1);

    // hitung page
    var total = 0;

    dbQuery(db, 'select count(*) total from Nama').then((results, fields) => {
        total = results[0]['total'];
    });

    var rows = [];
    dbQuery(db, 'select * from Nama limit ? offset ?', [n, (page-1)*n])
    .then((results, fields) => {
            rows = results;
            res.render('form', {Nama: rows, flash: req.session.flash, pagination: {page: page
            	, total_pages: Math.floor(total/n, 1)
            	, prev_page: page > 1 ? page-1 : null
            	, next_page: page < Math.floor(total/n, 1) ? page+1: null}});
    })
    .catch(err => {
        res.send('error');
        console.log(err);
    });
});

http.post('/', (req, res) => {
    const nama = req.body.nama;
    const email = req.body.email;
    const password = req.body.password;

    dbQuery(db, 'insert into Nama (nama,email,password) values(?,?,?)', [nama, email, password])
	.then((results, fields) => {
	    req.session.flash.push({message: 'Data berhasil ditambah',
				    class: 'success'});

	    res.redirect('/');
	});
});

http.get('/delete/:id', (req, res) => {
    const id = req.params.id;

    dbQuery(db, 'delete from Nama where id=?', [id])
	.then((results, fields) => {
	    req.session.flash.push({message: 'Data berhasil dihapus',
		    class: 'warning'});
	    res.redirect('/');
	});
});

http.get('/update/:id', (req, res) => {
    const id = req.params.id;

    dbQuery(db, 'select * from Nama where id=?', [id])
	.then((results, fields) => {
		if (results.length >= 1)
			res.render('update', {Nama: results[0]});
		else
			res.status(404).send('Data ID = ' + id + ' not found');
	});
});

http.post('/update/:id', (req, res) => {
    const id = req.params.id;
    const nama = req.body.nama;
    const email = req.body.email;
    const password = req.body.password;
    
    dbQuery(db, 'update Nama set nama=?, email=?, password=?', [nama, email, password])
	.then((results, fields) => {
	    req.session.flash.push({message: 'Data berhasil diupdate',
				    class: 'success'});
	    res.redirect('/');

	});
});

http.listen(3000, () => {
	console.log('Listen to 3000 ...')
})