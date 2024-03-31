const db = [];

db.push({id: 1, text:'text11'});
db.push({id: 2, text:'text12'});

window.localStorage.setItem("log", JSON.stringify(db));

const db2 = JSON.parse(window.localStorage.getItem("log"));
console.log(db2);

