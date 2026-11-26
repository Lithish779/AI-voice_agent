import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Executive Color Palette
    DARK_BG = RGBColor(11, 19, 43)          # #0B132B Executive Navy
    LIGHT_BG = RGBColor(248, 250, 252)      # #F8FAFC Slate 50
    CARD_BG = RGBColor(255, 255, 255)       # #FFFFFF Clean White
    CARD_BORDER = RGBColor(226, 232, 240)   # #E2E8F0 Subtle Border
    CARD_DARK = RGBColor(20, 32, 60)        # #14203C Dark Card
    BORDER_DARK = RGBColor(30, 41, 59)      # #1E293B
    TEXT_MAIN = RGBColor(15, 23, 42)        # #0F172A Slate 900
    TEXT_MUTED = RGBColor(100, 116, 139)    # #64748B Slate 500
    TEXT_WHITE = RGBColor(255, 255, 255)
    AMBER = RGBColor(245, 158, 11)          # #F59E0B Solar Amber
    EMERALD = RGBColor(16, 185, 129)        # #10B981 Green
    BLUE = RGBColor(2, 132, 199)            # #0284C7 Blue
    PURPLE = RGBColor(147, 51, 234)         # #9333EA Purple
    ROSE = RGBColor(225, 29, 72)            # #E11D48 Rose

    def set_slide_bg(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, tag, title, subtitle, dark=False):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(11.733), Inches(0.3))
        tf_t = tag_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_top = tf_t.margin_bottom = tf_t.margin_left = tf_t.margin_right = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = tag.upper()
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = AMBER if dark else BLUE

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.78), Inches(11.733), Inches(0.6))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_top = tf_title.margin_bottom = tf_title.margin_left = tf_title.margin_right = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.bold = True
        p_title.font.size = Pt(22)
        p_title.font.color.rgb = TEXT_WHITE if dark else TEXT_MAIN

        # Subtitle
        sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.42), Inches(11.733), Inches(0.4))
        tf_sub = sub_box.text_frame
        tf_sub.word_wrap = True
        tf_sub.margin_top = tf_sub.margin_bottom = tf_sub.margin_left = tf_sub.margin_right = 0
        p_sub = tf_sub.paragraphs[0]
        p_sub.text = subtitle
        p_sub.font.size = Pt(12)
        p_sub.font.color.rgb = RGBColor(148, 163, 184) if dark else TEXT_MUTED

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1)
        else:
            card.line.fill.background()
        return card

    # ==========================================
    # SLIDE 1: HERO TITLE SLIDE (DARK)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1, DARK_BG)

    # Accent bar
    glow = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.1), Inches(0.12), Inches(4.8))
    glow.fill.solid()
    glow.fill.fore_color.rgb = AMBER
    glow.line.fill.background()

    # Pill badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.15), Inches(1.1), Inches(4.6), Inches(0.38))
    badge.fill.solid()
    badge.fill.fore_color.rgb = CARD_DARK
    badge.line.color.rgb = BORDER_DARK
    tf_b = badge.text_frame
    tf_b.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_b = tf_b.paragraphs[0]
    p_b.text = "☀️ ACME SOLAR • FULL-STACK AI VOICE AGENT"
    p_b.font.bold = True
    p_b.font.size = Pt(11)
    p_b.font.color.rgb = AMBER

    # Title & Subtitle
    t_box = s1.shapes.add_textbox(Inches(1.15), Inches(1.65), Inches(11.2), Inches(2.2))
    tf1 = t_box.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "Autonomous Conversational Voice AI"
    p1.font.bold = True
    p1.font.size = Pt(40)
    p1.font.color.rgb = TEXT_WHITE

    p2 = tf1.add_paragraph()
    p2.text = "Low-Latency Inbound Sales, RAG Knowledge Retrieval & Autonomous Calendar Dispatch"
    p2.font.size = Pt(19)
    p2.font.color.rgb = RGBColor(148, 163, 184)
    p2.space_before = Pt(8)

    # 4 Tech Architecture Cards
    cards = [
        ("FastAPI Microservice", "Python 3 • Faster-Whisper int8 STT, Sentence Transformers & Piper Neural TTS", BLUE),
        ("Groq LPU Reasoning", "Qwen-27B LLM • Single-turn unified prompt with sub-600ms inference", AMBER),
        ("Vector Search RAG", "MongoDB Atlas • 384-dim dense cosine embeddings with factual guardrails", EMERALD),
        ("Full-Stack Operations", "Node.js API • Redis call memory • React Vite executive dispatch dashboard", PURPLE),
    ]
    for i, (ctitle, cdesc, ccol) in enumerate(cards):
        col_left = 1.15 + (i * 2.85)
        add_card(s1, col_left, 4.25, 2.7, 1.95, CARD_DARK, BORDER_DARK)
        tb = s1.shapes.add_textbox(Inches(col_left + 0.15), Inches(4.4), Inches(2.4), Inches(1.65))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        p_ct = tf.paragraphs[0]
        p_ct.text = ctitle
        p_ct.font.bold = True
        p_ct.font.size = Pt(13)
        p_ct.font.color.rgb = ccol
        p_cd = tf.add_paragraph()
        p_cd.text = cdesc
        p_cd.font.size = Pt(11)
        p_cd.font.color.rgb = RGBColor(148, 163, 184)
        p_cd.space_before = Pt(6)

    # Footer
    foot_tb = s1.shapes.add_textbox(Inches(1.15), Inches(6.6), Inches(11.0), Inches(0.4))
    tf_f = foot_tb.text_frame
    p_f = tf_f.paragraphs[0]
    p_f.text = "Author: Lithish | Architecture, Benchmarks & Technical Interview Presentation"
    p_f.font.size = Pt(11)
    p_f.font.color.rgb = RGBColor(100, 116, 139)

    # ==========================================
    # SLIDE 2: THE PROBLEM & OPPORTUNITY
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2, LIGHT_BG)
    add_header(s2, "Market Challenge & Vision", "The Inbound Sales Problem & Autonomous AI Solution", "Bridging the gap between static web forms and costly, high-latency call centers.")

    # Left Column: The Problem Card
    add_card(s2, 0.8, 2.0, 5.6, 4.8)
    tb_prob = s2.shapes.add_textbox(Inches(1.1), Inches(2.2), Inches(5.0), Inches(4.4))
    tf_p = tb_prob.text_frame
    tf_p.word_wrap = True
    p = tf_p.paragraphs[0]
    p.text = "Traditional Inbound Sales Bottlenecks"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = ROSE

    points_prob = [
        ("High Drop-off on Web Forms:", "Over 67% of homeowners bounce on static forms before completing solar assessment queries."),
        ("Expensive Human Telephony:", "Outsourced call centers cost $1.20 - $1.80 per minute with high turnover and zero 24/7 coverage."),
        ("Painful Latency in Voice Bots:", "Traditional IVR & voice AI chains take 8-15 seconds per turn, breaking natural human conversation."),
        ("Information Inaccuracy:", "Human reps frequently misquote complex solar tax credits (ITC 30%), net metering policies, and warranty tiers.")
    ]
    for title, desc in points_prob:
        p_pt = tf_p.add_paragraph()
        p_pt.text = "• " + title + " "
        p_pt.font.bold = True
        p_pt.font.size = Pt(12)
        p_pt.font.color.rgb = TEXT_MAIN
        p_pt.space_before = Pt(10)
        run = p_pt.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Right Column: The Solution Card
    add_card(s2, 6.7, 2.0, 5.8, 4.8)
    tb_sol = s2.shapes.add_textbox(Inches(7.0), Inches(2.2), Inches(5.2), Inches(4.4))
    tf_s = tb_sol.text_frame
    tf_s.word_wrap = True
    p = tf_s.paragraphs[0]
    p.text = "The Acme Autonomous Voice Platform"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = EMERALD

    points_sol = [
        ("Sub-2-Second Conversational Latency:", "Optimized down to ~1.5s total turnaround, delivering human-speed, interruption-free dialog."),
        ("RAG-Grounded Domain Knowledge:", "Directly queries verified solar specs (warranties, 10kW sizing, Tesla Powerwall) with 0% hallucinations."),
        ("Autonomous Calendar Scheduling:", "Extracts natural date/time preferences, detects slot conflicts, and writes directly to MongoDB."),
        ("99.7% Operational Cost Reduction:", "Delivers high-fidelity sales consultations for ~$0.0035 per call versus $1.50+ for human reps.")
    ]
    for title, desc in points_sol:
        p_st = tf_s.add_paragraph()
        p_st.text = "✓ " + title + " "
        p_st.font.bold = True
        p_st.font.size = Pt(12)
        p_st.font.color.rgb = TEXT_MAIN
        p_st.space_before = Pt(10)
        run = p_st.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 3: SYSTEM ARCHITECTURE
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3, LIGHT_BG)
    add_header(s3, "System Architecture", "Four-Tier Distributed Voice Architecture", "Microservices designed for non-blocking asynchronous execution and horizontal scalability.")

    tiers = [
        ("TIER 1: CLIENT & INGESTION", [
            ("Customer Voice Portal", "Web Speech API with 600ms VAD silence detection"),
            ("Audio Streamer", "Binary audio chunks over HTTP & WebSockets"),
            ("Telephony Bridge", "Asterisk ARI (AudioServer) SIP trunk support"),
            ("Operations Console", "Vite + React modern executive dashboard")
        ], BLUE),
        ("TIER 2: ORCHESTRATION BACKEND", [
            ("Express API Engine", "REST endpoints for calls, appointments & CRM"),
            ("Redis Call State", "Sub-millisecond ephemeral conversational memory"),
            ("Conflict Resolver", "Atomic booking lock & slot clash detection"),
            ("Call Summarizer", "Post-call automated CRM lead sync")
        ], PURPLE),
        ("TIER 3: FASTAPI AI ENGINE", [
            ("Faster-Whisper STT", "int8 quantized local transcription & language detect"),
            ("Sentence-Transformers", "384-dim normalized vector embeddings"),
            ("Piper Neural TTS", "ONNX runtime producing 22kHz speech in <700ms"),
            ("FastAPI Async ASGI", "High-concurrency binary audio streaming")
        ], EMERALD),
        ("TIER 4: COGNITION & DATA", [
            ("Groq LPU Engine", "Qwen-27B running unified inference in ~500ms"),
            ("MongoDB Atlas", "Vector search index for semantic chunk matching"),
            ("Appointments Ledger", "Persistent consultation & dispatch records"),
            ("Customer CRM", "Lead scores, caller profiles, and transcripts")
        ], AMBER)
    ]

    for i, (title, items, col) in enumerate(tiers):
        left = 0.8 + (i * 2.95)
        add_card(s3, left, 2.0, 2.8, 4.8)

        # Header pill inside card
        tb_h = s3.shapes.add_textbox(Inches(left + 0.15), Inches(2.2), Inches(2.5), Inches(0.6))
        tf_h = tb_h.text_frame
        tf_h.word_wrap = True
        tf_h.margin_top = tf_h.margin_bottom = tf_h.margin_left = tf_h.margin_right = 0
        p_h = tf_h.paragraphs[0]
        p_h.text = title
        p_h.font.bold = True
        p_h.font.size = Pt(11)
        p_h.font.color.rgb = col

        # Items
        tb_i = s3.shapes.add_textbox(Inches(left + 0.15), Inches(2.8), Inches(2.5), Inches(3.8))
        tf_i = tb_i.text_frame
        tf_i.word_wrap = True
        tf_i.margin_top = tf_i.margin_bottom = tf_i.margin_left = tf_i.margin_right = 0

        for j, (it_title, it_desc) in enumerate(items):
            p_it = tf_i.paragraphs[0] if j == 0 else tf_i.add_paragraph()
            p_it.text = it_title
            p_it.font.bold = True
            p_it.font.size = Pt(11)
            p_it.font.color.rgb = TEXT_MAIN
            if j > 0:
                p_it.space_before = Pt(8)
            p_id = tf_i.add_paragraph()
            p_id.text = it_desc
            p_id.font.size = Pt(10)
            p_id.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 4: THE VOICE LIFECYCLE (CONVERSATIONAL TURN)
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4, LIGHT_BG)
    add_header(s4, "Execution Flow", "The Conversational Turn Lifecycle: Step-by-Step", "How a user speech utterance transforms into an intelligent voice reply in ~1.5 seconds.")

    steps = [
        ("01", "Voice Ingestion", "User speaks into browser or phone; VAD triggers turn submission within 600ms of speech pause.", BLUE),
        ("02", "Parallel RAG Lookup", "Simultaneously embeds query to fetch top 3 solar chunks and pulls customer record in ~20ms.", PURPLE),
        ("03", "Unified Groq LLM", "Single prompt produces spoken reply, intent, sentiment, lead scores, and slot in ~500ms.", AMBER),
        ("04", "Conflict Checking", "If demo slot requested, checks MongoDB for overlaps and atomically books consultation.", EMERALD),
        ("05", "Neural Voice (TTS)", "Piper ONNX generates high-fidelity 22kHz speech; HTML5 audio plays back immediately.", ROSE),
        ("06", "CRM & Memory Sync", "Appends turn to Redis session memory; writes lead updates and transcripts to MongoDB.", BLUE),
    ]

    for i, (num, stitle, sdesc, scol) in enumerate(steps):
        row = i // 3
        col = i % 3
        left = 0.8 + (col * 3.95)
        top = 2.0 + (row * 2.45)
        add_card(s4, left, top, 3.8, 2.25)

        tb = s4.shapes.add_textbox(Inches(left + 0.2), Inches(top + 0.2), Inches(3.4), Inches(1.85))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0

        p_num = tf.paragraphs[0]
        p_num.text = f"STEP {num} • {stitle.upper()}"
        p_num.font.bold = True
        p_num.font.size = Pt(11)
        p_num.font.color.rgb = scol

        p_desc = tf.add_paragraph()
        p_desc.text = sdesc
        p_desc.font.size = Pt(11)
        p_desc.font.color.rgb = TEXT_MUTED
        p_desc.space_before = Pt(8)

    # ==========================================
    # SLIDE 5: FASTAPI AI SERVICE DEEP DIVE
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5, LIGHT_BG)
    add_header(s5, "Deep Dive", "Python FastAPI AI Engine: STT, Embeddings & TTS", "High-performance inference microservice hosting optimized ML models on local CPU/GPU.")

    col_data = [
        ("Speech-to-Text (STT)", "Faster-Whisper (int8 Quantized)", BLUE, [
            ("Model Architecture:", "OpenAI Whisper optimized with CTranslate2 backend."),
            ("Voice Activity Detection:", "Built-in Silero VAD filters out ambient background noise."),
            ("Multilingual Support:", "Auto-detects spoken language (English, Spanish, Hindi, etc.)."),
            ("Latency Profile:", "~350ms transcription on CPU with beam_size=1.")
        ]),
        ("Vector Embeddings", "Sentence-Transformers", EMERALD, [
            ("Embedding Model:", "paraphrase-multilingual-MiniLM-L12-v2 model."),
            ("Dimensionality:", "384-dimensional dense normalized vector embeddings."),
            ("Inference Speed:", "Batched tensor inference runs in ~15ms for RAG queries."),
            ("Cosine Similarity:", "Normalized vectors enable instant dot-product scoring.")
        ]),
        ("Text-to-Speech (TTS)", "Piper Neural Voice (ONNX)", AMBER, [
            ("Synthesis Engine:", "Ultra-fast neural text-to-speech trained on Lessac voice."),
            ("Fidelity:", "Generates 22,050 Hz crystal-clear WAV audio."),
            ("Execution Overhead:", "Sub-700ms audio generation with zero GPU dependency."),
            ("Direct Audio Stream:", "Streams directly to browser HTML5 audio element.")
        ])
    ]

    for i, (title, sub, col, bullet_list) in enumerate(col_data):
        left = 0.8 + (i * 3.95)
        add_card(s5, left, 2.0, 3.8, 4.8)

        tb = s5.shapes.add_textbox(Inches(left + 0.2), Inches(2.2), Inches(3.4), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.bold = True
        p_t.font.size = Pt(14)
        p_t.font.color.rgb = col

        p_s = tf.add_paragraph()
        p_s.text = sub
        p_s.font.size = Pt(11)
        p_s.font.color.rgb = TEXT_MUTED
        p_s.space_before = Pt(2)

        for b_title, b_desc in bullet_list:
            p_b = tf.add_paragraph()
            p_b.text = "• " + b_title + " "
            p_b.font.bold = True
            p_b.font.size = Pt(11)
            p_b.font.color.rgb = TEXT_MAIN
            p_b.space_before = Pt(10)
            run = p_b.add_run()
            run.text = b_desc
            run.font.bold = False
            run.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 6: RAG & FACTUAL GROUNDING
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6, LIGHT_BG)
    add_header(s6, "Knowledge Retrieval", "RAG Knowledge Architecture & Anti-Hallucination Guardrails", "Grounding conversational sales agents in verified solar technical and pricing policies.")

    # Left: The RAG Pipeline
    add_card(s6, 0.8, 2.0, 5.7, 4.8)
    tb_rag = s6.shapes.add_textbox(Inches(1.05), Inches(2.2), Inches(5.2), Inches(4.4))
    tf_r = tb_rag.text_frame
    tf_r.word_wrap = True
    p = tf_r.paragraphs[0]
    p.text = "Semantic Retrieval Pipeline"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = BLUE

    rag_steps = [
        ("Domain Knowledge Ingestion:", "Solar knowledge documents (warranties, tax credits, financing plans, technical specifications) split into 500-word chunks with 80-word overlap."),
        ("Vector Indexing:", "Chunks converted into 384-dimensional dense vectors and stored in MongoDB Atlas with a vectorSearch index."),
        ("Real-Time Query Retrieval:", "Caller queries are embedded on-the-fly; top-k (k=3) most relevant chunks retrieved via cosine similarity in ~18ms."),
        ("Dynamic Context Injection:", "Retrieved chunks injected directly into the LLM system prompt prior to reasoning.")
    ]
    for st, sd in rag_steps:
        p_st = tf_r.add_paragraph()
        p_st.text = "1. " + st + " " if st.startswith("Domain") else ("2. " if st.startswith("Vector") else ("3. " if st.startswith("Real") else "4. ")) + st + " "
        p_st.font.bold = True
        p_st.font.size = Pt(11)
        p_st.font.color.rgb = TEXT_MAIN
        p_st.space_before = Pt(8)
        run = p_st.add_run()
        run.text = sd
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Right: Anti-Hallucination Guardrails
    add_card(s6, 6.8, 2.0, 5.7, 4.8)
    tb_grd = s6.shapes.add_textbox(Inches(7.05), Inches(2.2), Inches(5.2), Inches(4.4))
    tf_g = tb_grd.text_frame
    tf_g.word_wrap = True
    p = tf_g.paragraphs[0]
    p.text = "Factual Guardrails & Compliance"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = EMERALD

    guardrails = [
        ("Strict Grounding Constraint:", "Prompt explicitly mandates answering ONLY from retrieved context. Unknown details trigger a promise of specialist follow-up."),
        ("Deterministic Pricing:", "Guarantees exact quotes: Basic Plan ($99/mo, 5kW), Pro Plan ($199/mo, 10kW + battery), Enterprise ($499/mo)."),
        ("Regulatory Compliance:", "Accurately quotes the 30% Federal Residential Clean Energy Credit (ITC) without legal liability."),
        ("Human Escalation Circuit Breaker:", "Angry callers or human requests automatically flag intent='escalate' and route to supervisors.")
    ]
    for gt, gd in guardrails:
        p_gt = tf_g.add_paragraph()
        p_gt.text = "✓ " + gt + " "
        p_gt.font.bold = True
        p_gt.font.size = Pt(11)
        p_gt.font.color.rgb = TEXT_MAIN
        p_gt.space_before = Pt(8)
        run = p_gt.add_run()
        run.text = gd
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 7: THE LATENCY OPTIMIZATION STORY (KEY INTERVIEW WIN)
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7, LIGHT_BG)
    add_header(s7, "Engineering Case Study", "The 8.2x Latency Optimization: From 12s to 1.5s", "How we diagnosed, profiled, and eliminated conversational latency bottlenecks.")

    # 3 Comparison Cards
    opt_cards = [
        ("BOTTLENECK 1: HEAVY LLM", "openai/gpt-oss-120b", "9,100 ms", "qwen/qwen3.8-27b on Groq", "500 ms",
         "120B reasoning model generated excessive internal thought tokens before replying. Replaced with fast 27B model on Groq LPUs.", ROSE, EMERALD),
        ("BOTTLENECK 2: DUAL ROUNDTRIPS", "groq(classify) -> groq(reply)", "7,350 ms", "Single Unified Prompt", "550 ms",
         "Sequential calls doubled LLM wait time. Engineered a unified prompt returning reply, intent, lead, and slot in one pass.", ROSE, EMERALD),
        ("BOTTLENECK 3: SILENCE TIMEOUT", "Browser VAD 2000-3500ms", "2,500 ms", "Tuned VAD to 600ms", "600 ms",
         "User waited several seconds of dead silence after speaking. Reduced pause threshold to 600ms plus instant send trigger.", ROSE, EMERALD),
    ]

    for i, (title, b_before, t_before, b_after, t_after, desc, c_bad, c_good) in enumerate(opt_cards):
        left = 0.8 + (i * 3.95)
        add_card(s7, left, 2.0, 3.8, 4.8)

        tb = s7.shapes.add_textbox(Inches(left + 0.2), Inches(2.2), Inches(3.4), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = BLUE

        # Before Box
        p_b1 = tf.add_paragraph()
        p_b1.text = "BEFORE: " + b_before
        p_b1.font.bold = True
        p_b1.font.size = Pt(11)
        p_b1.font.color.rgb = c_bad
        p_b1.space_before = Pt(8)
        p_t1 = tf.add_paragraph()
        p_t1.text = "⏱ Latency: " + t_before
        p_t1.font.size = Pt(10)
        p_t1.font.color.rgb = TEXT_MUTED

        # After Box
        p_b2 = tf.add_paragraph()
        p_b2.text = "AFTER: " + b_after
        p_b2.font.bold = True
        p_b2.font.size = Pt(11)
        p_b2.font.color.rgb = c_good
        p_b2.space_before = Pt(10)
        p_t2 = tf.add_paragraph()
        p_t2.text = "⚡ Latency: " + t_after
        p_t2.font.size = Pt(10)
        p_t2.font.color.rgb = c_good

        # Description
        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MAIN
        p_d.space_before = Pt(12)

    # ==========================================
    # SLIDE 8: DUAL APPLICATION INTERFACES
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s8, LIGHT_BG)
    add_header(s8, "User Experience", "Dual Interfaces: Customer Caller & Staff Dispatch Console", "Purpose-built client experiences for inbound customers and solar sales operations.")

    # Left: Customer Calling View
    add_card(s8, 0.8, 2.0, 5.7, 4.8)
    tb_c = s8.shapes.add_textbox(Inches(1.05), Inches(2.2), Inches(5.2), Inches(4.4))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    p = tf_c.paragraphs[0]
    p.text = "Customer Calling Portal (/call)"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = BLUE

    cust_feats = [
        ("Frictionless Inbound Access:", "Public link accessible from any browser or smartphone without installing apps or accounts."),
        ("Optional Lead Priming:", "Customer can optionally enter their name and budget upfront for customized instant qualification."),
        ("Real-Time Speech Bubbles:", "Live transcribed speech bubbles for both caller and AI agent with animated speech waveforms."),
        ("Instant Send Override:", "Provides 'Send Now ⚡' tap action to bypass silence timeouts when callers finish speaking."),
        ("Audio Unlock & Fallback:", "Mobile Safari/Chrome audio context unlock with automatic Web Speech API fallback.")
    ]
    for ft, fd in cust_feats:
        p_ft = tf_c.add_paragraph()
        p_ft.text = "• " + ft + " "
        p_ft.font.bold = True
        p_ft.font.size = Pt(11)
        p_ft.font.color.rgb = TEXT_MAIN
        p_ft.space_before = Pt(7)
        run = p_ft.add_run()
        run.text = fd
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Right: Staff Dashboard View
    add_card(s8, 6.8, 2.0, 5.7, 4.8)
    tb_s = s8.shapes.add_textbox(Inches(7.05), Inches(2.2), Inches(5.2), Inches(4.4))
    tf_s = tb_s.text_frame
    tf_s.word_wrap = True
    p = tf_s.paragraphs[0]
    p.text = "Solar Dispatcher Console (/staff)"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = EMERALD

    staff_feats = [
        ("Executive Overview & KPIs:", "Displays confirmed consultation count, 7-day average lead qualification score, and active inquiry queue."),
        ("Consultation Pipeline Donut:", "Visual interactive breakdown of Confirmed, Completed, and Active inquiries."),
        ("Bookings & Calendar Ledger:", "Direct CRUD operations to mark consultations Done, Cancelled, or reschedule slots."),
        ("CRM Customer Directory:", "Complete caller profiles with order status, installed system capacity, and phone numbers."),
        ("RAG Knowledge Ingestor:", "Live knowledge base management to ingest, inspect, and delete vector indexed chunks.")
    ]
    for ft, fd in staff_feats:
        p_ft = tf_s.add_paragraph()
        p_ft.text = "• " + ft + " "
        p_ft.font.bold = True
        p_ft.font.size = Pt(11)
        p_ft.font.color.rgb = TEXT_MAIN
        p_ft.space_before = Pt(7)
        run = p_ft.add_run()
        run.text = fd
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 9: UNIT ECONOMICS & 100K CONCURRENT SCALING
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s9, LIGHT_BG)
    add_header(s9, "Economics & Scale", "Unit Economics & 100k Concurrent Call Scaling", "Massive cost efficiency and architecture designed for massive enterprise concurrency.")

    # Left: Economics
    add_card(s9, 0.8, 2.0, 5.7, 4.8)
    tb_eco = s9.shapes.add_textbox(Inches(1.05), Inches(2.2), Inches(5.2), Inches(4.4))
    tf_e = tb_eco.text_frame
    tf_e.word_wrap = True
    p = tf_e.paragraphs[0]
    p.text = "Unit Economics per 3-Minute Voice Call"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = EMERALD

    eco_rows = [
        ("Groq LPU LLM Reasoning:", "$0.0018", "(~6 conversational turns @ $0.0003/turn)"),
        ("On-Device STT + Neural TTS:", "$0.0009", "(FastAPI self-hosted worker compute)"),
        ("Redis Memory & Mongo Storage:", "$0.0008", "(Atlas & session cache operations)"),
        ("Total AI Voice Agent Cost:", "$0.0035", "Per fully qualified inbound sales call"),
        ("Human Call Center Rep Cost:", "$1.50 - $2.50", "Per 3-minute basic qualification call"),
        ("Net Enterprise Cost Reduction:", "99.7%", "Over $149,000 saved per 100k calls")
    ]
    for r_title, r_cost, r_sub in eco_rows:
        p_r = tf_e.add_paragraph()
        p_r.text = r_title + " "
        p_r.font.bold = True
        p_r.font.size = Pt(11)
        p_r.font.color.rgb = TEXT_MAIN
        p_r.space_before = Pt(6)
        r_cost_run = p_r.add_run()
        r_cost_run.text = r_cost + " "
        r_cost_run.font.bold = True
        r_cost_run.font.color.rgb = EMERALD if "AI" in r_title or "Reduction" in r_title else (ROSE if "Human" in r_title else BLUE)
        r_sub_run = p_r.add_run()
        r_sub_run.text = r_sub
        r_sub_run.font.bold = False
        r_sub_run.font.color.rgb = TEXT_MUTED

    # Right: 100k Scaling Blueprint
    add_card(s9, 6.8, 2.0, 5.7, 4.8)
    tb_scale = s9.shapes.add_textbox(Inches(7.05), Inches(2.2), Inches(5.2), Inches(4.4))
    tf_sc = tb_scale.text_frame
    tf_sc.word_wrap = True
    p = tf_sc.paragraphs[0]
    p.text = "100,000 Concurrent Call Scaling Strategy"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = BLUE

    scale_points = [
        ("Stateless Node.js App Containers:", "Horizontally autoscale across Kubernetes pods with zero sticky session requirements."),
        ("Redis Cluster Ephemeral State:", "Sharded Redis memory handles sub-millisecond conversation history across 100k concurrent channels."),
        ("FastAPI GPU Worker Pools:", "STT and TTS inference scaled using Triton Inference Server or ONNX Runtime with TensorRT."),
        ("Groq LPU Enterprise Tier:", "Dedicated Groq hardware capacity delivers consistent 500ms LLM completions at any call volume."),
        ("MongoDB Atlas Sharded Cluster:", "Automatic partition sharding for call transcripts and customer records ensures zero write contention.")
    ]
    for sp_t, sp_d in scale_points:
        p_sp = tf_sc.add_paragraph()
        p_sp.text = "• " + sp_t + " "
        p_sp.font.bold = True
        p_sp.font.size = Pt(11)
        p_sp.font.color.rgb = TEXT_MAIN
        p_sp.space_before = Pt(6)
        run = p_sp.add_run()
        run.text = sp_d
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 10: CONCLUSION & INTERVIEW Q&A (DARK)
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s10, DARK_BG)
    add_header(s10, "Summary & Demo", "Conclusion & Technical Interview Takeaways", "Key engineering highlights, system demo, and open discussion.", dark=True)

    # 3 Summary Dark Cards
    summary_cards = [
        ("Full-Stack Competency", "Demonstrated end-to-end engineering across FastAPI ML backends, Node.js event loops, Redis caching, MongoDB Vector Search, and React Vite.", BLUE),
        ("Production Latency Optimization", "Diagnosed 21s turn lag down to 1.5s human conversational speed through unified prompt architecture and Groq LPUs.", AMBER),
        ("Autonomous Business Value", "Built an autonomous system that doesn't just chat, but actively qualifies leads and resolves calendar conflicts in real time.", EMERALD),
    ]

    for i, (stitle, sdesc, scol) in enumerate(summary_cards):
        left = 0.8 + (i * 3.95)
        add_card(s10, left, 2.0, 3.8, 3.0, CARD_DARK, BORDER_DARK)
        tb = s10.shapes.add_textbox(Inches(left + 0.2), Inches(2.2), Inches(3.4), Inches(2.6))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        p_st = tf.paragraphs[0]
        p_st.text = stitle
        p_st.font.bold = True
        p_st.font.size = Pt(14)
        p_st.font.color.rgb = scol
        p_sd = tf.add_paragraph()
        p_sd.text = sdesc
        p_sd.font.size = Pt(11)
        p_sd.font.color.rgb = RGBColor(148, 163, 184)
        p_sd.space_before = Pt(8)

    # Bottom Contact & Demo Bar
    add_card(s10, 0.8, 5.3, 11.733, 1.5, CARD_DARK, BORDER_DARK)
    tb_b = s10.shapes.add_textbox(Inches(1.1), Inches(5.45), Inches(11.1), Inches(1.2))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p_b1 = tf_b.paragraphs[0]
    p_b1.text = "LIVE SYSTEM DEMO & ARTIFACTS"
    p_b1.font.bold = True
    p_b1.font.size = Pt(12)
    p_b1.font.color.rgb = AMBER

    p_b2 = tf_b.add_paragraph()
    p_b2.text = "• Live Customer Voice Portal: https://informative-worker-ties-linux.trycloudflare.com/call\n• Live Staff Operations Console: https://informative-worker-ties-linux.trycloudflare.com/staff\n• GitHub Source Repository: https://github.com/Lithish779/AI-voice_agent"
    p_b2.font.size = Pt(11)
    p_b2.font.color.rgb = TEXT_WHITE
    p_b2.space_before = Pt(4)

    output_path = "/Users/lithish/Downloads/voice-agent/Acme_Solar_Voice_Agent_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

build_presentation()
