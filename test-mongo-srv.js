const mongoose = require('mongoose');

const uri = 'mongodb+srv://mridulsriv26:Lucifer%402620@chartsign.mhtqdga.mongodb.net/Chartsign';

mongoose.connect(uri)
  .then(() => {
    console.log('Connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
