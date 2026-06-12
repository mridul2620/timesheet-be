const mongoose = require('mongoose');

const uri = 'mongodb://mridulsriv26:Lucifer%402620@ac-mlstiya-shard-00-00.mhtqdga.mongodb.net:27017,ac-mlstiya-shard-00-01.mhtqdga.mongodb.net:27017,ac-mlstiya-shard-00-02.mhtqdga.mongodb.net:27017/Chartsign?ssl=true&replicaSet=atlas-ed087v-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(() => {
    console.log('Connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
