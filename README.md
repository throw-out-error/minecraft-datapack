# What is it?
minecraft-datapack is a module for making minecraft datapcks with node to cut down on repitition  
[![npm version](https://badge.fury.io/js/%40throw-out-error%2Fminecraft-datapack.svg)](https://badge.fury.io/js/%40throw-out-error%2Fminecraft-datapack)

# Examples

## Simple datapack
```js
const {Datapack,Namespace}=require("minecraft-datapack");
const myDatapack=new Datapack("My datapack",__dirname,{"description":"my cool datapack!"});
//You can use addNamespace to add a precreated namespace
let namespace=new Namespace("namespace");
myDatapack.addNamespace(namespace);
//Or you can use createNamespace to create and add a namespace
myDatapack.createNamespace("namespace2");
//And you can delete them with deleteNamespace
myDatapack.deleteNamespace("namespace2");
//Use the compile method of the datapack class to output the files
myDatapack.compile();
```
## Adding tags
```js
const {Datapack}=require("minecraft-datapack");
const datapack=new Datapack("ree",__dirname,{description:"REE!"});
//Creates a block tag called minecraft:beacon_base_blocks, with the values ["minecraft:dirt"]
datapack.minecraft.createTag("beacon_base_blocks","block",["minecraft:dirt"]);
datapack.compile();
//Now when you load this in your minecraft world you can have beacon pyramids made from dirt! :D
```
## Adding smelting recipes
```js
const {Datapack,recipes:{SmeltingRecipe}}=require("minecraft-datapack");
const datapack=new Datapack("stone",__dirname,{description:"adds a recipe to convert diorite, granite, and andesite to stone"});
let stone_conversion=datapack.createNamespace("stone_conversion");
stone_conversion.createTag("stone_variants","item",["minecraft:diorite","minecraft:andesite","minecraft:granite"]);
//Add a recipe using the namespace class's addRecipe method
stone_conversion.addRecipe(new SmeltingRecipe("stone_conversion",{
    //The ingredient can be a tag or an item id eg. minecraft:dirt, if using a tag it must be pre-fixed with a #
    ingredient:"#stone_conversion:stone_variants",
    result:"minecraft:stone",
    experience:1,
    //Select which smelting block you want to use eg. a furnace, blast furnace, smoker, or camp fire
    type:'minecraft:blasting'
}));
datapack.compile();
//When loaded in your minecraft world you can put granite, diorite, and andesite in a blast furnace to get stone :D
```
## Adding crafting recipes
```js
const {Datapack,recipes:{ShapedCraftingRecipe}}=require("minecraft-datapack");
const datapack=new Datapack("Slab crafting",__dirname,{description:"Let's you make blocks from slabs"});
let slabs=datapack.createNamespace("slabs");
slabs.addRecipe(
    new ShapedCraftingRecipe("oak_planks_from_slabs",{pattern:[
        //The pattern can be 1x1 2x2 or 3x3
        "#",
        "#"
        //The key tells minecraft what to replace each character in the strings with
    ],key:{
        "#":"minecraft:oak_slab",
    },result:"minecraft:oak_planks"})
);
datapack.compile();
```
## Adding loot tables
```js
const {Datapack,loot:{ItemEntry,LootFunction}}=require("../module");
const randomCount=(min,max)=>new LootFunction({function:"minecraft:set_count",count:{min,max}});
const datapack=new Datapack("Dirt",__dirname,{description:"adds a dirt loot table for dirt lovers!"});
datapack.createNamespace("dirt")
//create the loot table
.createLootTable("dirt")
//add a pool to the table
.createPool({
    rolls:1
})
//add an item to the pool
.addEntry(new ItemEntry({name:"minecraft:dirt"}))
.addFunction(randomCount(1,64))
datapack.compile()
//if you run /loot give @s dirt:dirt ingame you will get 1-64 dirt
```
# Change log
## 1.6 the predicate update!
### The class LootCondition has been renamed to Condition and is exported under the name predicate.Condition
This is due to conditions being used in predicates as well as loot tables, the decision to move the condition  
class to the predicate namespace was due to predicates being able to be used as more complex conditions.
### Conerted code to typescript

# Features

## Already here:

1) A class called 'Datapack' to create datapacks that can have namespaces:  
Datapack  
|_data  
&nbsp;&nbsp;&nbsp;&nbsp;|_minecraft  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_functions  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_tags  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_blocks  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_items  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_functions  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_recipes  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_loot_tables  
&nbsp;&nbsp;&nbsp;&nbsp;|_namespace  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_functions  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_tags  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_blocks  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_items  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_functions  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_recipes  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_loot_tables  
2) The ability to add tag files to your datapacks  
3) The ability to add recipes to your datapacks  

## In progress:


## Planned to be implemented:
The ability to add predicate, advancement, and function files.  
