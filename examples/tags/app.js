const {Datapack}=require("../module");
const datapack=new Datapack("ree",__dirname,{description:"REE!"});
datapack.minecraft.createTag("beacon_base_blocks","block");
datapack.minecraft.blockTags["beacon_base_blocks"].values.push("minecraft:dirt");
datapack.compile();