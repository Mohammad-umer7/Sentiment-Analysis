# BERT Sentiment Analysis 🤖

A modern sentiment analysis tool built with Python and PyTorch using the **DistilBERT** transformer model. This project classifies movie reviews as either **Positive** or **Negative** with high confidence.

## 🧠 Model Hosting
The fine-tuned model weights are hosted on **[Hugging Face](https://huggingface.co/Mohammad-Umer7/imdb-sentiment-bert)**. 
The application is designed to:
1.  **Automatically download** the model from Hugging Face on first run.
2.  **Fallback** to a local `sentiment_model` folder if available.
3.  **Self-train** from scratch using the IMDB dataset if no pre-trained model is found.

## 🛠️ Installation
...

1. **Clone the repo:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sentiment-analysis.git
   cd sentiment-analysis
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## 🎮 How to Run

Run the main application:
```bash
python app_bert.py
```

> **Note:** The first time you run this without a `sentiment_model` folder, it will download the IMDB dataset (~60MB) and train the model. This might take some time depending on your hardware (CPU vs GPU).

## 📄 License
MIT
