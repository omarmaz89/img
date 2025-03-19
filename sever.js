const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());
app.use(cors());

const MODEL_URLS = {
    0: "https://deepai.org/machine-learning-model/anime-portrait-generator",
    1: "https://deepai.org/machine-learning-model/text2img",
    3: "https://deepai.org/machine-learning-model/cyberpunk-generator"
};

app.post("/generate", async (req, res) => {
    const { text, mode } = req.body;
    if (!text || typeof mode !== "number" || !MODEL_URLS[mode]) {
        return res.status(400).json({ error: "Invalid input" });
    }

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
        const url = MODEL_URLS[mode];
        await page.goto(url, { waitUntil: "networkidle2" });

        await page.waitForSelector(".model-input-text-input.dynamic-border", { visible: true });
        await page.type(".model-input-text-input.dynamic-border", text);

        await page.waitForSelector("#modelSubmitButton", { visible: true });
        await page.click("#modelSubmitButton");

        await new Promise(resolve => setTimeout(resolve, 8000));

        const imageUrl = await page.evaluate(() => {
            const imgElement = document.querySelector("#place_holder_picture_model img");
            return imgElement ? imgElement.src : null;
        });

        await browser.close();

        if (imageUrl) {
            res.json({ imageUrl });
        } else {
            res.status(500).json({ error: "Image generation failed" });
        }
    } catch (error) {
        await browser.close();
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
