const {Datapack}=require("../..");
const myDatapack=new Datapack("My datapack",__dirname,{"description":"my cool datapack!"});
myDatapack.createNamespace("namespace");
myDatapack.compile();