const express = require('express');
const path = require('path');
const fs = require('fs');
const qs = require('qs');
const handlebars = require('express-handlebars').create({
	defaultLayout: 'main', 
	extname: 'hbs',
	helpers: {
		exit: `document.location='/main'`
	}
});


//#region Настройки
let     app   = express();
const   PORT  = 3000;

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
const publicPath = path.join(__dirname, 'views', 'public');
app.use(express.static(publicPath));
//#endregion



//#region Маршруты
app.get('/', async function(request, response) {
    response.redirect('/main');
    response.end();
});


app.get('/main', async function(request, response) {
	fs.readFile('DB.json', 'utf8', (err, users) => {
		if (err) {console.error(err);return;}
		response.render("main", {users:JSON.parse(users), clickable:false});
	});
});


app.get('/add', async function(request, response) {
	fs.readFile('DB.json', 'utf8', (err, users) => {
		if (err) {console.error(err);return;}
		response.render("add", {users:JSON.parse(users), clickable:true});
	});
});


app.post('/add', async function(request, response) {
	let data = '';
	let filePath = 'DB.json';
	request.on('data', (chunk)=>{
		data += chunk;
	});
	request.on('end', ()=>{
		let DB;
		try {
			DB = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            let newUser = {
                "id" : -1, 
                "name":qs.parse(data)['name'],
                "second_name":qs.parse(data)['second_name'],
                "number":qs.parse(data)['number']
                }
			newUser.id = Number(DB[DB.length - 1].id) + 1;
			DB[DB.length] = newUser;
			DB = JSON.stringify(DB, null, 2);
		} catch (error) {
			console.error('Error reading:', error.message);
		}
		fs.writeFile(filePath, DB, 'utf8', (err) => {
			if (err) {
				console.error('Error writing', err.message);
			} else {
				console.log('/add successfully.');
			}
		});

	})
	response.redirect('/main');
	response.end();
});



const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/update', async function(request, response) {
    let filePath = 'DB.json';
    try {
        let DB = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let updatedUser = {
            id: Number(request.body.id),
            name: request.body.name,
            second_name: request.body.second_name,
            number: request.body.number
        };
        DB = DB.map(user => (user.id === updatedUser.id ? updatedUser : user));
        fs.writeFile(filePath, JSON.stringify(DB, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing:', err.message);
            } else {
                console.log('/update successfully.');
            }
        });
    } catch (error) {
        console.error('Error reading:', error.message);
    }
    response.redirect('/main');
});



app.get('/update', async function(request, response) {
	fs.readFile('DB.json', 'utf8', (err, users) => {
		if (err){
            console.error(err);return;
        }
		let data = JSON.parse(users);
		let usr = data.find((elem)=>elem.id == request.query.id)
		response.render("update.hbs", {
			users:data,
			user:usr, 
			clickable:true
		});
	});
});



app.delete('/delete/:id', async function(request, response) {
    let filePath = 'DB.json';
    try {
        let DB = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let userId = Number(request.params.id);
        DB = DB.filter(user => user.id !== userId);
        fs.writeFile(filePath, JSON.stringify(DB, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing:', err.message);
            } else {
                console.log('/delete/:id successfully.');
            }
        });
    } catch (error) {
        console.error('Error reading:', error.message);
    }
    response.redirect('/main');
});

//#endregion

app.listen(PORT, ()=>
 console.log(`Server is running on http://localhost:${PORT}`));


