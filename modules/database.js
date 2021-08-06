const fs = require("fs")
const path = require('path')
const Datastore = require('nedb')

const databases = [
  {name:'settings', time_record: false},
  {name:'log', time_record: true}
]

const database =  {
  init(data_folder){
    if (!fs.existsSync(path.resolve(data_folder))){fs.mkdirSync(path.resolve(data_folder))}
    for (db of databases) {
      this[`${db.name}_store`] = new Datastore({ filename: path.join(data_folder, `${db.name}.db`), autoload: true, timestampData: db.time_record})
    }
  },
  insert(db,doc){
   return new Promise((resolve, reject) => {
     this[db].insert(doc, (err, newDoc) => {
       err ? resolve({success:false,data:false,error:err}) : resolve({success:true,data:[newDoc],error:false})
     })
   })
  },
  find(db,filer_data){
  return new Promise((resolve, reject) => {
    this[db].find(filer_data, (err, docs) => {
      err ? resolve({success:false,data:false,error:err}) : resolve({success:true,data:docs,error:false})
    })
  })
  },
  count(db,filer_data){
   return new Promise((resolve, reject) => {
     this[db].count(filer_data, (err, count) => {
       err ? resolve({success:false,data:false,error:err}) : resolve({success:true,data:count,error:false})
     })
   })
  },
  update(db,query,update,options){
   return new Promise((resolve, reject) => {
     this[db].update(query,update,options, (err, count) => {
       err ? resolve({success:false,data:false,error:err}) : resolve({success:true,data:count,error:false})
     })
   })
  },
  remove(db,query,options){
   return new Promise((resolve, reject) => {
     this[db].remove(query,options, (err, count) => {
       err ? resolve({success:false,data:false,error:err}) : resolve({success:true,data:count,error:false})
     })
   })
  },
  compact(db,timeout){
   return new Promise((resolve, reject) => {
     this[db].persistence.compactDatafile()
     setTimeout(()=>{
       this[db].ensureIndex({ fieldName: 'createdAt', expireAfterSeconds: 604800 })
       resolve({success:true,data:[],error:false})
     },timeout)
   })
  },
  sort(db,query,order,limit){
    if (limit) {
     return new Promise((resolve, reject) => {
       this[db].find(query).sort(order).limit(limit).exec((err, docs) => {
         err ? resolve({success:false,data:false,error:err}) : resolve({success:true,data:docs,error:false})
       })
     })
   }else{
    return new Promise((resolve, reject) => {
      this[db].find(query).sort(order).exec((err, docs) => {
        err ? resolve({success:false,data:false,error:err}) : resolve({success:true,data:docs,error:false})
      })
    })
   }
  }
}

for (db of databases) {
  eval(`database.${db.name} = {
    async insert(doc){const result = await database.insert('${db.name}_store', doc);return result},
    async find(doc){const result = await database.find('${db.name}_store', doc);return result},
    async sort(data, order, limit = 0){const result = await database.sort('${db.name}_store', data, order, limit);return result},
    async count(filer_data){const result = await database.count('${db.name}_store', filer_data);return result},
    async update(query,update,options){const result = await database.update('${db.name}_store', query,update,options);return result},
    async remove(query,options={}){const result = await database.remove('${db.name}_store', query,options);return result},
    async compact(timeout=0){const result = await database.compact('${db.name}_store',timeout);return result}
  }`)
}


// export default database
module.exports = database
