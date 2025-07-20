const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
app.use(express.static('public'));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
const upload = multer({ dest: "uploads/" });
const imageToGenerativePart = (filePath) => ({
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType: 'image',
    },
})
// Fungsi pembantu untuk mengubah file menjadi format yang diterima Google AI
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}
const PORT = 3000;

app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ output: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  const filePath = req.file.path;
  const buffer = fs.readFileSync(filePath);
  const base64Data = buffer.toString('base64');
  const mimeType = req.file.mimetype; 

  try {
    const documentPart = {
      inlineData: {data : base64Data, mimeType: mimeType}
    };
    const result = await model.generateContent([req.body.prompt, documentPart]);
    const response = await result.response;
    res.json({ output: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    // Hapus file setelah selesai diproses
    fs.unlinkSync(filePath);
  }
})

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  const audiobuffer = fs.readFileSync(req.file.path);
  const base64Audio = audiobuffer.toString('base64');
  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType: req.file.mimetype
    },
  };
  try {
    const result = await model.generateContent([
      'Transcribe or analyze the following audio : ', audioPart]);
    const response = await result.response;
    res.json({ output: response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
      // Hapus file setelah selesai diproses
      fs.unlinkSync(req.file.path);
  }
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    const prompt = req.body.prompt || "Jelaskan apa yang ada di dalam gambar ini";

    // Memanggil fungsi pembantu dengan path dan tipe file dari file yang di-upload
    const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);

    // Mengirim prompt dan gambar ke model AI.
    // Catatan: Format pengiriman diubah ke array [...] agar sesuai standar Gemini.
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;

    res.status(200).json({ output: response.text() });

  } catch (error) {
    // Menampilkan error jika terjadi masalah
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    // Selalu hapus file dari server setelah selesai diproses
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
});
// --- TAMBAHKAN BAGIAN INI ---
app.listen(PORT, () => {
  console.log(`Gemini API server is running at http://localhost:${PORT}`);
});