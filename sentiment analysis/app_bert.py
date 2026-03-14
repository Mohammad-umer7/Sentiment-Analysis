import os, torch, pandas as pd
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from sklearn.model_selection import train_test_split
from tqdm import tqdm

# Config
HF_MODEL_ID = "Mohammad-Umer7/imdb-sentiment-bert"
MODEL_PATH = "sentiment_model"
BATCH_SIZE, EPOCHS, MAX_LEN = 16, 4, 256

# Device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🖥️ Device: {device}" + (f" ({torch.cuda.get_device_name(0)})" if device.type == 'cuda' else ""))

# Dataset
class ReviewDataset(Dataset):
    def __init__(self, texts, labels, tokenizer):
        self.texts, self.labels, self.tokenizer = texts, labels, tokenizer
    def __len__(self): return len(self.texts)
    def __getitem__(self, i):
        enc = self.tokenizer(self.texts[i], truncation=True, padding='max_length', max_length=MAX_LEN, return_tensors='pt')
        return {'input_ids': enc['input_ids'].squeeze(), 'attention_mask': enc['attention_mask'].squeeze(), 'label': torch.tensor(self.labels[i])}

# Load tokenizer and model
model_loaded = False
print(f"🔤 Loading model from {HF_MODEL_ID}...")
try:
    tokenizer = DistilBertTokenizer.from_pretrained(HF_MODEL_ID)
    model = DistilBertForSequenceClassification.from_pretrained(HF_MODEL_ID).to(device)
    print("✅ Model loaded from Hugging Face!")
    model_loaded = True
except Exception:
    print("⚠️ Could not load from Hugging Face. Checking local storage...")
    if os.path.exists(MODEL_PATH):
        try:
            tokenizer = DistilBertTokenizer.from_pretrained(MODEL_PATH)
            model = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH).to(device)
            print("📁 Model loaded from local 'sentiment_model' folder!")
            model_loaded = True
        except Exception:
            print("❌ Local model files are corrupted.")

if not model_loaded:
    print("📥 Model not found. Starting training from scratch...")
    print("🔤 Loading base tokenizer...")
    tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
    print("📥 Downloading data...")
    df = pd.read_csv("https://raw.githubusercontent.com/Ankit152/IMDB-sentiment-analysis/master/IMDB-Dataset.csv")
    df['label'] = (df['sentiment'] == 'positive').astype(int)
    print(f"✅ Loaded {len(df)} reviews")

    train_t, test_t, train_l, test_l = train_test_split(df['review'].tolist(), df['label'].tolist(), test_size=0.2, random_state=42)
    train_loader = DataLoader(ReviewDataset(train_t, train_l, tokenizer), batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(ReviewDataset(test_t, test_l, tokenizer), batch_size=BATCH_SIZE)

    print("🧠 Loading DistilBERT...")
    model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased', num_labels=2).to(device)
    optimizer = AdamW(model.parameters(), lr=2e-5)

    # Train
    print(f"\n🚀 Training ({EPOCHS} epochs)...")
    for epoch in range(EPOCHS):
        model.train()
        loss_sum = 0
        for b in tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS}"):
            optimizer.zero_grad()
            out = model(b['input_ids'].to(device), attention_mask=b['attention_mask'].to(device), labels=b['label'].to(device))
            out.loss.backward()
            optimizer.step()
            loss_sum += out.loss.item()
        print(f"   Loss: {loss_sum/len(train_loader):.4f}")

    # Evaluate
    print("\n📊 Evaluating...")
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for b in tqdm(test_loader, desc="Testing"):
            preds = model(b['input_ids'].to(device), attention_mask=b['attention_mask'].to(device)).logits.argmax(dim=1)
            correct += (preds == b['label'].to(device)).sum().item()
            total += len(b['label'])
    print(f"\n🎉 Accuracy: {correct/total*100:.2f}%")

    # Save
    print(f"💾 Saving model...")
    model.save_pretrained(MODEL_PATH)
    tokenizer.save_pretrained(MODEL_PATH)
    print("✅ Saved!")

# Predict function
def predict(text):
    model.eval()
    enc = tokenizer(text, truncation=True, padding='max_length', max_length=MAX_LEN, return_tensors='pt')
    with torch.no_grad():
        probs = torch.softmax(model(enc['input_ids'].to(device), attention_mask=enc['attention_mask'].to(device)).logits, dim=1)
        pred = probs.argmax(dim=1).item()
    return ("POSITIVE" if pred == 1 else "NEGATIVE", probs[0][pred].item() * 100)

# Interactive
print("\n--- 🤖 BERT SENTIMENT ANALYZER ---")
print("Type 'quit' to exit.\n")

while True:
    text = input("📝 Review: ")
    if text.lower() == 'quit':
        print("Goodbye!")
        break
    label, conf = predict(text)
    print(f"🤖 {label} ({conf:.1f}% confident)\n")
