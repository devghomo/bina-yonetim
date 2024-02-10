
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
const Aidat = require('./models/Aidat');
const app = express();
require("dotenv").config();
const port = process.env.PORT;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const connectDB = require("./connectMongo");
connectDB()
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'admin'));
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

// Ana sayfa route'u
app.get('/', (req, res) => {
    res.render('index');
});
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/signup', (req, res) => {
    res.render('signup');
});
app.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, block, doorNumber, apartmentSize, password } = req.body;

        const existingUser = await User.findOne({ $or: [{ email: email }, { phone: phone }] });
        if (existingUser) {
            return res.status(400).send('Bu e-posta adresi veya telefon numarası zaten kullanılıyor.');
        }
        const existingAddress = await User.findOne({ block: block, doorNumber: doorNumber });
        if (existingAddress) {
            return res.status(400).send('Bu blok ve kapı numarasına sahip bir kullanıcı zaten var.');
        }

        const newUser = new User({
            name,
            email,
            phone,
            block,
            doorNumber,
            apartmentSize,
            password,
            isAdmin: 0 // default olarak 0
        });
        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Bir hata oluştu, kullanıcı kaydedilemedi.');
    }
});


let sessionUser = null;

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });

        if (!user || user.password !== password) {
            return res.status(401).send('E-posta adresi veya şifre hatalı');
        }

        sessionUser = user;

        res.status(200).send('Giriş başarılı. Ana sayfaya yönlendiriliyorsunuz.');

    } catch (error) {
        console.error(error);
        res.status(500).send('Giriş yapılamadı. Bir hata oluştu.');
    }
});

app.get('/userpage', async (req, res) => {
    try {
        if (sessionUser) {
            const aidatlar = await Aidat.find();
            res.render('userPage', { name: sessionUser.name, isAdmin: sessionUser.isAdmin, aidatlar: aidatlar });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Aidatlar alınamadı. Bir hata oluştu.');
    }
});
app.get('/aidat/:id', async (req, res) => {
    try {
        const aidat = await Aidat.findById(req.params.id);
        if (!aidat) {
            return res.status(404).send('Aidat detayları bulunamadı.');
        }
        res.render('aidatDetail', { aidat: aidat });
    } catch (error) {
        console.error(error);
        res.status(500).send('Aidat detayları alınamadı. Bir hata oluştu.');
    }
});

app.get('/admin/users', async (req, res) => {
    try {
        // Kullanıcı girişi yapılmış mı ve isAdmin 1 mi kontrolü
        if (!sessionUser || sessionUser.isAdmin !== 1) {
            return res.status(403).send('Bu sayfaya erişim izniniz yok.');
        }

        const { block, apartmentSize } = req.query;

        let query = {};
        if (block) {
            query.block = block;
        }
        if (apartmentSize) {
            query.apartmentSize = apartmentSize;
        }

        const users = await User.find(query).sort({ name: 1 });

        res.render('admin/users', { users: users });
    } catch (error) {
        console.error(error);
        res.status(500).send('Kullanıcılar listelenemedi. Bir hata oluştu.');
    }
});
app.get('/adminPage', async (req, res) => {
    try {
        // Kullanıcı girişi yapılmış mı ve isAdmin 1 mi kontrolü
        if (!sessionUser || sessionUser.isAdmin !== 1) {
            return res.status(403).send('Bu sayfaya erişim izniniz yok.');
        }

        // Admin sayfasının içeriği render edilecek
        res.render('admin/adminPage', { name: sessionUser.name });
    } catch (error) {
        console.error(error);
        res.status(500).send('Admin sayfası yüklenemedi. Bir hata oluştu.');
    }
});
// "/admin/aidatYonetim" route'u için GET işlemi
app.get('/admin/aidatYonetim', async (req, res) => {
    try {
        const aidatlar = await Aidat.find();
        res.render('admin/aidatYonetimi', { aidatlar: aidatlar });
    } catch (error) {
        console.error('Aidatlar alınamadı:', error);
        res.status(500).send('Aidatlar alınamadı. Bir hata oluştu.');
    }
});

app.post('/admin/aidatYonetim', async (req, res) => {
    try {
        const { amount, year, month, details } = req.body;


        const newAidat = new Aidat({
            amount,
            details,
            year,
            month
        });
        await newAidat.save();

        const aidatlar = await Aidat.find();
        res.render('admin/aidatYonetimi', { aidatlar: aidatlar });

    } catch (error) {
        console.error('Aidat eklenemedi:', error);
        res.status(500).send('Aidat eklenemedi. Bir hata oluştu.');
    }
});

app.post('/admin/aidat', async (req, res) => {
    try {
        const { amount, month, year, details, price, name } = req.body;

        const newAidat = new Aidat({
            amount,
            month,
            year,
            details,
            price,
            name
        });
        await newAidat.save();

        res.redirect('/userPage');
    } catch (error) {
        console.error('Aidat eklenemedi:', error);
        res.status(500).send('Aidat eklenemedi. Bir hata oluştu.');
    }
});

app.post('/filterAidat', async (req, res) => {
    try {
        const { apartmentType } = req.body;

        // Filtreleme işlemi: Sadece seçilen daire tipine sahip aidatları al
        const aidatlar = await Aidat.find({ apartmentType: apartmentType });

        // Kullanıcıya yeniden userPage'i göster, bu sefer filtrelenmiş aidatlarla birlikte
        res.render('userPage', { name: sessionUser.name, aidatlar: aidatlar });

    } catch (error) {
        console.error('Aidatlar alınamadı:', error);
        res.status(500).send('Aidatlar alınamadı. Bir hata oluştu.');
    }
});
app.delete('/admin/aidatYonetim/:id', async (req, res) => {
    try {
        const aidatId = req.params.id;
        // Aidatı veritabanından silme işlemi
        await Aidat.findByIdAndDelete(aidatId);
        res.sendStatus(200); // Başarılı yanıt
    } catch (error) {
        console.error('Aidat silinemedi:', error);
        res.sendStatus(500); // Sunucu hatası yanıtı
    }
});
app.get('/admin/aidat/edit/:id', async (req, res) => {
    try {
        const aidat = await Aidat.findById(req.params.id);
        if (!aidat) {
            return res.status(404).send('Düzenlenecek aidat bulunamadı.');
        }
        res.render('aidatEdit', { aidat: aidat });
    } catch (error) {
        console.error('Aidat düzenleme sayfası yüklenemedi:', error);
        res.status(500).send('Aidat düzenleme sayfası yüklenemedi. Bir hata oluştu.');
    }
});






app.delete('/deleteUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Kullanıcıyı veritabanından silme işlemi
        await User.findByIdAndDelete(userId);
        res.sendStatus(200);
    } catch (error) {
        console.error('Kullanıcı silinemedi:', error);
        res.sendStatus(500);
    }
});
app.get('/getUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Kullanıcı kimliğiyle ilgili kullanıcıyı veritabanından bulma işlemi
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        res.json(user);
    } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
