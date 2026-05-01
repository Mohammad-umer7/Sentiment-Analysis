import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from tqdm import tqdm

HF_MODEL_ID = "Mohammad-Umer7/imdb-sentiment-bert"
BATCH_SIZE, EPOCHS, MAX_LEN, LR = 8, 3, 256, 1e-5

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {device}" + (f" ({torch.cuda.get_device_name(0)})" if device.type == 'cuda' else ""))

# ── Synthetic nuanced data ─────────────────────────────────────────────────────
NEGATIVE = [
    # Contrastive — starts good, ends bad
    "the movie started well but completely fell apart in the second half",
    "it had a promising opening but the ending ruined everything",
    "the first act was great but the rest was a total mess",
    "i enjoyed the beginning but by the end i was bored out of my mind",
    "the movie was going good until after the middle it became unwatchable",
    "started with potential but delivered nothing worthwhile",
    "the setup was interesting but the payoff was deeply disappointing",
    "good first half terrible second half overall not worth it",
    "the trailers looked amazing but the actual film was a letdown",
    "it promised a lot and delivered almost nothing",
    "the first twenty minutes gave me hope but it quickly faded",
    "nice visuals but the story was a complete disaster",
    "the cast was solid but the writing let everyone down",
    "beautiful cinematography wasted on a boring storyline",
    "the idea was original but the execution was painfully bad",
    "had all the ingredients for a great film but still managed to fail",
    "i liked where it was heading but it lost me completely",
    "the concept was fresh but the film itself was stale",
    "it started as a five star movie and ended as a one star one",
    "everything seemed fine until the third act collapsed",
    # Until constructions
    "the movie was enjoyable until it stopped making any sense",
    "i was having a good time until the ridiculous twist ruined it",
    "things were looking up until the director made baffling choices",
    "the characters were likable until they did completely stupid things",
    "i was invested until the plot holes became impossible to ignore",
    "great pacing until it suddenly dragged for forty minutes straight",
    "i was almost convinced this was good until the finale",
    "the film held my attention until it completely lost the plot",
    "impressive until the final act which undid all the good work",
    "it was working until the unnecessary subplot took over",
    # However / but / despite
    "however well it started it ended in complete failure",
    "despite a strong cast the film was utterly forgettable",
    "despite the hype it was one of the most boring films i have seen",
    "the reviews were glowing however the film was deeply mediocre",
    "despite a big budget the result felt cheap and lazy",
    "it looked expensive but felt hollow and emotionally empty",
    "beautifully shot but completely soulless",
    "technically impressive but narratively bankrupt",
    "the acting was fine but the script was awful",
    "the music was great but nothing else worked",
    # Understated negatives
    "not exactly what i would call a good film",
    "i would not rush to recommend this to anyone",
    "it was not really what i was hoping for",
    "i have seen far better films in this genre",
    "not the worst thing i have ever watched but close",
    "i was not impressed and neither will you be",
    "this was not worth two hours of my time",
    "i left the cinema feeling empty and cheated",
    "honestly i expected so much more from this",
    "it did not live up to even my lowest expectations",
    "i cannot say i enjoyed any part of this experience",
    "there was very little to enjoy here",
    "i struggled to stay awake through most of it",
    "i almost walked out halfway through",
    "it felt like a very long and unrewarding experience",
    "i kept checking my watch throughout the entire film",
    "the longer it went on the more disappointed i became",
    "by the end i regretted spending money on this",
    "it was neither entertaining nor thought provoking",
    "a forgettable and deeply uninspiring piece of cinema",
    # Negation patterns
    "not a single scene in this film felt genuine",
    "there was not one moment that surprised or moved me",
    "the characters had no depth whatsoever",
    "nothing in this film made me feel anything at all",
    "none of the jokes landed and none of the drama worked",
    "not even the strong performances could save this film",
    "no amount of good acting can fix a script this weak",
    "there was no real story worth following here",
    "i found nothing redeeming about this production",
    "not worth watching even if you have nothing else to do",
    # Clearly negative
    "this is easily one of the worst films i have ever seen",
    "a complete and utter waste of time and money",
    "i cannot believe this got made let alone released",
    "absolutely terrible from start to finish",
    "one of the most boring and pointless films in recent memory",
    "the script was laughably bad and the direction was worse",
    "i would not wish this film on my worst enemy",
    "a cinematic disaster of the highest order",
    "everything about this film was wrong",
    "painfully dull and completely without merit",
    "the worst kind of film — expensive and empty",
    "a genuinely awful experience from beginning to end",
    "there is no reason for this film to exist",
    "i sat through two hours of absolute nothing",
    "this film insults the intelligence of its audience",
    "the plot made no sense and the characters were unbearable",
    "i felt my time being actively wasted",
    "no redeeming qualities whatsoever",
    "a total embarrassment for everyone involved",
    "i have never been so bored in a cinema in my life",
    # Mixed but negative lean
    "it has a good scene here and there but the overall film is weak",
    "there are moments of brilliance surrounded by hours of tedium",
    "occasionally engaging but mostly a chore to sit through",
    "a few good performances but they are stranded in a bad film",
    "you can see what they were trying to do but it just does not work",
    "the ambition is admirable but the result is a mess",
    "interesting ideas executed extremely poorly",
    "the message is good but the delivery is terrible",
    "it means well but it fails on almost every level",
    "i appreciate the effort but the film is still bad",
    "there are glimmers of something better buried in the wreckage",
    "a handful of good moments cannot save two hours of mediocrity",
    "the highlights are few and far between",
    "more bad than good by a significant margin",
    "the good parts only make the bad parts more frustrating",
    # Sarcastic / ironic negatives
    "oh yes this was absolutely the film of the century",
    "what a masterpiece of confusion and boredom",
    "if you enjoy wasting your evening this is the film for you",
    "truly groundbreaking in how unoriginal it is",
    "i have rarely laughed as hard at how bad a film can be",
    # Specific issues
    "the pacing was so slow i nearly fell asleep three times",
    "the dialogue was so bad it was almost painful to listen to",
    "the plot twists were predictable from the very first minute",
    "the ending made absolutely no sense whatsoever",
    "the villain was completely unconvincing and cartoonish",
    "the romantic subplot was forced and completely unnecessary",
    "the comedy fell completely flat throughout",
    "the horror elements were neither scary nor tense",
    "the action sequences were confusingly edited and boring",
    "the final battle was anticlimactic and deeply unsatisfying",
    # Comparisons
    "nowhere near as good as the original film",
    "a massive step down from the previous entry in the series",
    "the sequel is far worse than the already disappointing first film",
    "compared to similar films this one fails in every department",
    "even by low budget standards this was poorly made",
    # Regret based
    "i really wanted to like this but i simply could not",
    "i went in with an open mind and came out deeply disappointed",
    "i gave it every chance and it still let me down",
    "i was rooting for this film and it still failed me",
    "despite trying to enjoy it i found nothing to hold onto",
    "i wanted this to be good so badly but it just was not",
    "i kept hoping it would improve but it never did",
    "by the final scene i had given up hoping for anything",
    "i stuck with it until the end and it was not worth it",
    "i genuinely tried to find something positive here and failed",
    # Short but clearly negative
    "absolutely dreadful",
    "a massive disappointment",
    "complete rubbish from start to finish",
    "unwatchable and unpleasant",
    "a total waste of everyone's time",
    "boring predictable and forgettable",
    "nothing works in this film",
    "i hated almost every minute",
    "deeply unsatisfying experience",
    "one of the worst films this year",
    "save yourself the trouble and skip it",
    "i want my two hours back",
    "utterly pointless filmmaking",
    "a joyless tedious slog",
    "an insult to the audience",
    "poorly written poorly directed poorly acted",
    "everything that can go wrong does go wrong",
    "i cannot find a single good thing to say",
    "perhaps the most boring film i have ever sat through",
    "do not bother with this one",
    # Extra nuanced negatives
    "it had a good heart but a very bad brain",
    "the passion was there but the talent was not",
    "you can feel the effort but the result is still a failure",
    "with a better script this might have been something",
    "almost good but not quite and that makes it more frustrating",
    "so close to being decent but it never gets there",
    "it had everything going for it and still failed",
    "the potential was enormous and entirely wasted",
    "a film that tries very hard and achieves very little",
    "all the pieces were there but they never came together",
    "this could have been great in better hands",
    "a compelling premise thoroughly destroyed by poor execution",
    "what a shame that so much talent produced so little",
    "i can see what they were going for but it missed completely",
    "the vision was there but the skill was not",
    "well intentioned but ultimately hollow and unsatisfying",
    "it raised my hopes and then dashed them completely",
    "disappointingly average given all the talent involved",
    "too flawed to recommend despite its occasional strengths",
    "a film that frustrates more than it entertains",
    "it wears its ambitions on its sleeve but never delivers",
    "the story had legs but the film had no idea where to go",
    "impressive on the surface but empty underneath",
    "stylish but vapid and ultimately meaningless",
    "slick production values hiding a deeply dull film",
    # Product / service reviews (not just movies)
    "the product looked great in photos but in person it was cheap and flimsy",
    "fast delivery but the item arrived damaged and unusable",
    "good customer service but the product itself is terrible",
    "works fine at first but breaks down after a week",
    "nice packaging but the contents were a huge disappointment",
    "ordered this twice and both times it fell apart quickly",
    "does not do what it says on the box at all",
    "the description was misleading and the product did not match",
    "would not buy again and cannot recommend to anyone",
    "returned it immediately after seeing how poor the quality was",
    # Restaurant / food reviews
    "the restaurant looked lovely but the food was cold and tasteless",
    "great atmosphere but the service was shockingly slow",
    "the menu sounded amazing but the dishes were mediocre at best",
    "overpriced for what you actually get on the plate",
    "nice decor but the food quality has really dropped off",
    "used to be our favourite but the quality has declined so much",
    "the starter was fine but the main course was inedible",
    "waited forty minutes for food that was not worth the wait",
    "will not be returning after the experience we had",
    "the reviews online were far more positive than it deserved",
    # Subtle / low confidence negatives
    "i suppose it was okay but i expected a lot more",
    "it was fine i guess but nothing special at all",
    "i do not really have strong feelings about it which says it all",
    "it left me feeling rather empty and unimpressed",
    "i have seen much better and this did not stand out at all",
    "not the worst but far from anything worth recommending",
    "it passed the time but i will not be thinking about it again",
    "a perfectly average experience which is its own kind of failure",
    "neither here nor there and ultimately forgettable",
    "three stars is generous but two seems too harsh — either way avoid it",
    # Mixed leaning negative
    "the good moments were too few and too far between",
    "it has heart but not enough talent to back it up",
    "you can feel them trying but trying is not the same as succeeding",
    "admirable in intention but deeply lacking in execution",
    "it almost works in places which makes the overall failure worse",
    "i wanted to root for it but it kept letting me down",
    "there is something here but the film cannot quite grasp it",
    "the bones of a good film buried under poor decisions",
    "a missed opportunity that is somehow more frustrating than a bad film",
    "it had everything except the ability to put it all together",
]

POSITIVE = [
    # Contrastive — starts mixed, ends well
    "it had a slow start but by the end i was completely hooked",
    "the first act was rough but the film really found its footing",
    "it took a while to get going but the payoff was absolutely worth it",
    "not perfect but genuinely enjoyable and surprisingly moving",
    "it had its flaws but overall i had a great time",
    "a few weak scenes but the film as a whole was excellent",
    "some pacing issues early on but it became something really special",
    "it stumbled at times but always recovered and won me over",
    "the beginning felt slow but by the climax i was completely invested",
    "rough around the edges but there is real heart here",
    # Until constructions — positive
    "i was skeptical until the film completely won me over in the second half",
    "i almost gave up until a stunning scene changed everything",
    "i was unsure until the ending which was simply perfect",
    "i had doubts until the film proved every one of them wrong",
    "i did not expect much until the performances blew me away",
    "i was indifferent until i found myself crying at the third act",
    "it took patience until the story suddenly clicked into place beautifully",
    "i was holding back until the film gave me every reason to care",
    "i resisted its charms until it became genuinely impossible to resist",
    "i almost left until a single scene made the whole thing worthwhile",
    # However / but / despite — positive
    "despite a few flaws this is a genuinely wonderful piece of cinema",
    "however imperfect it is i found myself deeply moved",
    "despite the slow pace the emotional payoff was tremendous",
    "it has rough patches but the overall experience is excellent",
    "not without issues but far more good than bad",
    "despite my reservations i ended up loving this film",
    "far from perfect but filled with moments of real magic",
    "despite some clunky dialogue the film is incredibly touching",
    "not flawless but easily one of the best films of the year",
    "despite a predictable plot the characters kept me completely engaged",
    # Understated positives
    "not bad at all actually quite impressive",
    "i was pleasantly surprised by how much i enjoyed this",
    "better than i expected and then some",
    "it won me over more than i thought it would",
    "i did not expect to like this as much as i did",
    "quietly effective and genuinely moving",
    "more enjoyable than its reputation suggested",
    "it worked better than it had any right to",
    "i walked in with low expectations and walked out smiling",
    "understated but deeply satisfying",
    "it does not shout but it stays with you long after",
    "a modest film that achieves something genuinely meaningful",
    "small in scale but big in heart",
    "a quiet film that sneaks up on you emotionally",
    "subtle and restrained but all the more powerful for it",
    "it does not try too hard and that is exactly why it works",
    "unassuming but quietly brilliant",
    "gentle but genuinely affecting",
    "simple storytelling done with great skill and warmth",
    "it earns its emotional moments without ever forcing them",
    # Positive despite issues
    "the plot has holes but the journey is so enjoyable it does not matter",
    "some scenes drag but the film is still a thoroughly rewarding watch",
    "the dialogue is occasionally clunky but the performances transcend it",
    "it is not entirely coherent but it is endlessly entertaining",
    "some tonal inconsistencies but the film is irresistible overall",
    "the third act is messy but everything before it is superb",
    "it loses its way briefly but finds it again in spectacular fashion",
    "the screenplay has weaknesses but the direction is masterful",
    "a few missteps along the way but the destination is worth it",
    "imperfect but charming compelling and genuinely enjoyable",
    # Clearly positive
    "one of the most moving and beautifully crafted films i have seen",
    "a masterpiece of storytelling that left me breathless",
    "absolutely stunning from the first frame to the last",
    "i was completely captivated from beginning to end",
    "a rare film that is both entertaining and genuinely profound",
    "it exceeded every expectation i had and then some",
    "one of those films you think about for days afterward",
    "an extraordinary achievement in every department",
    "i laughed i cried and i left the cinema feeling alive",
    "a film that reminds you why you love cinema",
    "simply magnificent in every possible way",
    "one of the best films i have seen in years",
    "i cannot recommend this highly enough",
    "a joyful generous and deeply human film",
    "i was completely transported from start to finish",
    "everything a film should be and more",
    "a genuine triumph of filmmaking",
    "effortlessly engaging entertaining and emotionally rich",
    "a beautiful film that deserves to be seen",
    "an absolute delight from start to finish",
    # Mixed but positive lean
    "it is not perfect but i loved every minute of it",
    "flawed but irresistible and full of life",
    "messy in places but brimming with energy and charm",
    "occasionally uneven but consistently entertaining",
    "not entirely successful but enormously likable",
    "it has problems but it also has genuine greatness",
    "more hits than misses and the hits are extraordinary",
    "a film with faults that i would happily watch again tomorrow",
    "rough but real and that rawness is what makes it great",
    "imperfect and all the more human for it",
    "it stumbles but its warmth and ambition shine through",
    "not everything works but what does work is exceptional",
    "some weak moments but the strength far outweighs them",
    "its imperfections are part of what makes it so lovable",
    "flawed in interesting ways that make it more not less compelling",
    # Nuanced praise
    "a film that grows on you the more you think about it",
    "it rewards patience with something truly extraordinary",
    "slow to start but devastatingly powerful by the end",
    "the kind of film that changes how you see things",
    "it asks difficult questions and answers them beautifully",
    "a film that trusts its audience and is better for it",
    "it lingers in the mind long after the credits roll",
    "the subtlety of the performances is what makes it great",
    "a film that earns every emotion it asks you to feel",
    "deeply layered and richly rewarding on repeated viewings",
    # After initial skepticism
    "i resisted this film and now i am recommending it to everyone",
    "i almost skipped this and i am so glad i did not",
    "i was wrong to doubt this and happy to admit it",
    "it surprised me in ways i did not think were possible",
    "this changed my mind about the genre entirely",
    "i had written it off and i owe it a genuine apology",
    "i went in expecting little and came out completely astonished",
    "far better than the premise suggested it had any right to be",
    "i judged it unfairly and the film proved me very wrong",
    "i am glad someone convinced me to give this a chance",
    # Short but clearly positive
    "absolutely wonderful",
    "a genuine gem",
    "utterly captivating from start to finish",
    "one of a kind",
    "simply outstanding",
    "a joy to watch",
    "a film i will never forget",
    "magnificent and moving",
    "everything i wanted and more",
    "a rare and precious film",
    "i loved every single minute",
    "extraordinary in every way",
    "watch this as soon as you can",
    "a deeply satisfying experience",
    "beautiful thoughtful and unforgettable",
    "a film that makes you feel something real",
    "could not have enjoyed this more",
    "brilliant on every level",
    "the best film i have seen this year",
    "i left the cinema in complete awe",
    # Extra nuanced positives
    "it is not trying to be something it is not and that is refreshing",
    "the honesty of this film is what makes it so affecting",
    "it treats its audience with intelligence and respect",
    "a film made with care love and genuine artistry",
    "it knows exactly what it is and executes it perfectly",
    "the quiet confidence of the filmmaking is extraordinary",
    "every choice the director makes feels right",
    "it builds slowly and pays off magnificently",
    "the emotional truth of this film is undeniable",
    "it gets under your skin and stays there",
    "a film that feels important and will endure",
    "it achieves exactly what it sets out to achieve",
    "the restraint shown here is a mark of real skill",
    "it never overreaches and that discipline is its strength",
    "a film of rare grace and genuine intelligence",
    "everything is in service of the story and it shows",
    "the performances are so natural you forget you are watching actors",
    "a film that feels both timeless and deeply of the moment",
    "it does more with less than most films do with everything",
    "the ending is perfect and earns every tear it produces",
    "a film that could only have been made by people who truly cared",
    "you feel the passion and craft in every single frame",
    "it is the kind of film that reminds you art still matters",
    "a completely absorbing and thoroughly satisfying experience",
    "i cannot imagine anyone watching this and not being moved",
    # Product / service reviews
    "excellent quality and arrived even faster than expected",
    "exactly as described and works perfectly out of the box",
    "best purchase i have made this year without question",
    "great value for money and the quality exceeded my expectations",
    "would absolutely buy this again and recommend it to everyone",
    "the product is even better in person than in the photos",
    "outstanding quality and the customer service was superb",
    "works exactly as advertised and then some",
    "five stars without hesitation a truly excellent product",
    "it solved my problem immediately and has worked perfectly since",
    # Restaurant / food reviews
    "the food was absolutely incredible and the service was perfect",
    "best meal i have had in a long time and worth every penny",
    "the chef clearly puts real love and skill into every dish",
    "the atmosphere was wonderful and the food was even better",
    "everything we ordered was delicious and beautifully presented",
    "cannot wait to go back the whole experience was wonderful",
    "the service was attentive without being intrusive and the food divine",
    "a hidden gem that deserves far more recognition than it gets",
    "every dish was a revelation and the prices were very fair",
    "we will definitely be making this our regular spot",
    # Subtle / understated positives
    "not bad at all in fact quite genuinely impressive",
    "i did not expect much and ended up being thoroughly charmed",
    "quietly excellent in a way that sneaks up on you",
    "more depth than you might expect from the outside",
    "i was pleasantly surprised at every turn",
    "it earns its place without ever demanding your attention",
    "does everything well without ever showing off",
    "not flashy but completely solid and genuinely satisfying",
    "simple effective and better than it had any right to be",
    "it grows on you and by the end you are completely won over",
    # Mixed but clearly positive lean
    "it is not without its flaws but i would watch it again in a heartbeat",
    "messy in places but the spirit of it is wonderful",
    "not everything works but what does work is truly special",
    "it stumbles occasionally but always lands on its feet",
    "some rough patches but the heart of it is completely genuine",
    "more good than bad and the good is really very good",
    "a few weak moments but they are easy to forgive",
    "imperfect but in a way that makes it feel more human and real",
    "it tries some things that do not work but i admire the ambition",
    "flawed but so full of life and energy that you cannot help loving it",
]

texts = [t for t in NEGATIVE] + [t for t in POSITIVE]
labels = [0] * len(NEGATIVE) + [1] * len(POSITIVE)
print(f"Synthetic dataset: {len(NEGATIVE)} negative + {len(POSITIVE)} positive = {len(texts)} total")

# ── Dataset ────────────────────────────────────────────────────────────────────
class ReviewDataset(Dataset):
    def __init__(self, texts, labels, tokenizer):
        self.texts, self.labels, self.tokenizer = texts, labels, tokenizer
    def __len__(self): return len(self.texts)
    def __getitem__(self, i):
        enc = self.tokenizer(self.texts[i], truncation=True, padding='max_length', max_length=MAX_LEN, return_tensors='pt')
        return {
            'input_ids': enc['input_ids'].squeeze(),
            'attention_mask': enc['attention_mask'].squeeze(),
            'label': torch.tensor(self.labels[i])
        }

# ── Load existing model from HF ────────────────────────────────────────────────
print(f"\nLoading model from {HF_MODEL_ID}...")
tokenizer = DistilBertTokenizer.from_pretrained(HF_MODEL_ID)
model = DistilBertForSequenceClassification.from_pretrained(HF_MODEL_ID).to(device)
print("Model loaded.")

# ── Fine-tune on synthetic data ────────────────────────────────────────────────
loader = DataLoader(ReviewDataset(texts, labels, tokenizer), batch_size=BATCH_SIZE, shuffle=True)
optimizer = AdamW(model.parameters(), lr=LR)

print(f"\nFine-tuning for {EPOCHS} epochs (lr={LR})...")
for epoch in range(EPOCHS):
    model.train()
    loss_sum = 0
    for b in tqdm(loader, desc=f"Epoch {epoch+1}/{EPOCHS}"):
        optimizer.zero_grad()
        out = model(b['input_ids'].to(device), attention_mask=b['attention_mask'].to(device), labels=b['label'].to(device))
        out.loss.backward()
        optimizer.step()
        loss_sum += out.loss.item()
    print(f"  Loss: {loss_sum/len(loader):.4f}")

# ── Quick eval on synthetic data ───────────────────────────────────────────────
model.eval()
correct = 0
with torch.no_grad():
    for b in DataLoader(ReviewDataset(texts, labels, tokenizer), batch_size=BATCH_SIZE):
        preds = model(b['input_ids'].to(device), attention_mask=b['attention_mask'].to(device)).logits.argmax(dim=1)
        correct += (preds == b['label'].to(device)).sum().item()
print(f"\nAccuracy on synthetic data: {correct/len(texts)*100:.1f}%")

# ── Save and push to HF ────────────────────────────────────────────────────────
print("\nSaving model locally...")
model.save_pretrained("sentiment_model")
tokenizer.save_pretrained("sentiment_model")

print(f"\nPushing to Hugging Face ({HF_MODEL_ID})...")
model.push_to_hub(HF_MODEL_ID)
tokenizer.push_to_hub(HF_MODEL_ID)
print("Done! Model updated on Hugging Face.")

# ── Predict function ───────────────────────────────────────────────────────────
def predict(text):
    model.eval()
    enc = tokenizer(text, truncation=True, padding='max_length', max_length=MAX_LEN, return_tensors='pt')
    with torch.no_grad():
        probs = torch.softmax(model(enc['input_ids'].to(device), attention_mask=enc['attention_mask'].to(device)).logits, dim=1)
        pred = probs.argmax(dim=1).item()
    return ("POSITIVE" if pred == 1 else "NEGATIVE", probs[0][pred].item() * 100)

print("\n--- SENTIMENT ANALYZER (Fine-tuned) ---")
print("Type 'quit' to exit.\n")
while True:
    text = input("Review: ")
    if text.lower() == 'quit':
        break
    label, conf = predict(text)
    print(f"{label} ({conf:.1f}% confident)\n")
