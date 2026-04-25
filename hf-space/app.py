import gradio as gr
from transformers import pipeline
import json

classifier = pipeline("text-classification", model="Mohammad-Umer7/imdb-sentiment-bert")

def analyze_single(text: str) -> str:
    result = classifier(text)[0]
    return json.dumps({"label": result["label"], "score": round(float(result["score"]), 4)})

def analyze_batch(texts_json: str) -> str:
    texts = json.loads(texts_json)
    results = classifier(texts)
    return json.dumps([{"label": r["label"], "score": round(float(r["score"]), 4)} for r in results])

with gr.Blocks() as demo:
    with gr.Tab("Single"):
        text_in = gr.Textbox(label="Review")
        text_out = gr.Textbox(label="Result")
        btn = gr.Button("Analyze")
        btn.click(analyze_single, text_in, text_out, api_name="predict")

    with gr.Tab("Batch"):
        batch_in = gr.Textbox(label="Reviews JSON")
        batch_out = gr.Textbox(label="Results JSON")
        batch_btn = gr.Button("Analyze Batch")
        batch_btn.click(analyze_batch, batch_in, batch_out, api_name="predict_batch")

demo.launch()
