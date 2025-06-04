const mongoose = require("mongoose");
const Material = require("../models/Project/Material");
const { generateEmbedding } = require("../utils/embed");

const materials = [];

const seedMaterials = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://imainloli:Mn4xRedy6Z7IrIMq@estetika.m0rumki.mongodb.net/auth_db?appName=Cluster0",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    await Material.deleteMany();

    for (const material of materials) {
      const embedding = await generateEmbedding(`${material.name}`);
      material.embedding = embedding;
    }

    await Material.insertMany(materials);

    console.log("Materials seeded successfully with embeddings");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding materials:", error);
    mongoose.connection.close();
  }
};

seedMaterials();
