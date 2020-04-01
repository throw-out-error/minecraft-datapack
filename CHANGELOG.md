# Change Log

- 1.6 the ~~predicate update~~ **function update**:
  The class LootCondition has been renamed to Condition and is exported under the name "predicate.Condition". This is due to conditions being used in predicates as well as loot tables, the decision to move the condition class to the predicate namespace was due to predicates being able to be used as more complex conditions.  
  Due to demand from our users(i.e. one person) we have decided to change this update to the function update :D  
  Added Command class and Value class!  
  Added ValueArray class!

```js
const {
  Command,
  Value,
  ValueArray,
} = require('@throw-out-error/minecraft-datapack').function
```

Changed how the constructors of the classes work to make them imply a minecraft namespace for certain parameters

```js
console.log(
  new (require('@throw-out-error/minecraft-datapack').Tag)('_', 'item', [
    'dirt',
    'stone',
  ]).values
)
//prints: ["minecraft:dirt","minecraft:stone"]
```

Added a function class, and the ability to add mcfunctions to datapacks :O

- Converted code to typescript

# Features

## Already here

1. A class called 'Datapack' to create datapacks that can have namespaces:  
   Datapack  
   |\_data  
   &nbsp;&nbsp;&nbsp;&nbsp;|\_minecraft  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_functions  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_tags  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_blocks  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_items  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_functions  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_recipes  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_loot_tables  
   &nbsp;&nbsp;&nbsp;&nbsp;|\_namespace  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_functions  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_tags  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_blocks  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_items  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_functions  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_recipes  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|\_loot_tables
2. The ability to add tag files to your datapacks
3. The ability to add recipes to your datapacks
