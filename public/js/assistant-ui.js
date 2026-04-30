/**
 * ELITE ELECTION — Gnan Voice Controller
 * Handles speech synthesis and recognition with localized Indian support.
 */
class GnanVoice {
  constructor(ui) {
    this.ui = ui;
    this.selectedVoice = null;
    this.isMuted = false;
    this._initVoices();
  }

  _initVoices() {
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = ["Google English India", "Microsoft Neerja Online (Natural) - English (India)", "Daniel", "Alex"];
      this.selectedVoice = voices.find(v => preferred.includes(v.name)) || voices.find(v => v.lang.startsWith("en-IN")) || voices.find(v => v.lang.startsWith("en"));
    };
    window.speechSynthesis.onvoiceschanged = pick;
    pick();
  }

  updateForLang(langCode) {
    const voices = window.speechSynthesis.getVoices();
    this.selectedVoice = voices.find(v => v.lang.startsWith(langCode)) || this.selectedVoice;
  }

  speak(text, lang) {
    if (this.isMuted) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/[•\-\n]/g, " ").trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    if (this.selectedVoice) utterance.voice = this.selectedVoice;
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'en' ? 'en-IN' : lang;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  cancel() {
    window.speechSynthesis.cancel();
  }
}

/**
 * ELITE ELECTION — Enhanced Assistant UI Controller
 */
class AssistantUI {
  constructor() {
    this.panel = document.getElementById("chat-panel");
    this.toggle = document.getElementById("chat-toggle");
    this.closeBtn = document.getElementById("chat-close");
    this.messages = document.getElementById("chat-messages");
    this.form = document.getElementById("chat-form");
    this.input = document.getElementById("chat-input");
    this.sendBtn = document.getElementById("chat-send");
    this.micBtn = document.getElementById("chat-mic");
    this.quickQuestions = document.getElementById("quick-questions");
    this.toastContainer = document.getElementById("toast-container");
    this.langSelect = document.getElementById("chat-lang");

    this.voice = new GnanVoice(this);
    this.selectedLang = "en";
    this.isOpen = false;
    this.currentZone = "welcome";
    this.isLoading = false;
    this.conversationHistory = [];
    this.hasShownTip = new Set();
    
    this._recognition = null;
    this._isRecording = false;
    this._initSpeechRecognition();
    this._bindEvents();
  }

  _bindEvents() {
    this.toggle.addEventListener("click", () => this.togglePanel());
    this.closeBtn.addEventListener("click", () => this.closePanel());
    
    if (this.langSelect) {
      this.langSelect.addEventListener("change", (e) => {
        this.selectedLang = e.target.value;
        this.voice.updateForLang(this.selectedLang);
        if (this._recognition) this._recognition.lang = this.selectedLang === 'en' ? 'en-IN' : this.selectedLang === 'hi' ? 'hi-IN' : this.selectedLang;
        this.clearHistory();
      });
    }

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });
    this.input.addEventListener("input", () => {
      this.sendBtn.disabled = !this.input.value.trim();
    });

    if (this.micBtn) {
      this.micBtn.addEventListener("click", () => this.toggleVoiceInput());
    }

    const muteBtn = document.getElementById("chat-mute");
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        this.voice.isMuted = !this.voice.isMuted;
        muteBtn.innerHTML = this.voice.isMuted ? "🔇" : "🔊";
        if (this.voice.isMuted) this.voice.cancel();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.closePanel();
    });
  }

  _initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this._recognition = new SpeechRecognition();
    this._recognition.lang = "en-IN";
    this._recognition.onstart = () => {
      this._isRecording = true;
      this.micBtn?.classList.add("recording");
      this.input.placeholder = "Listening...";
    };
    this._recognition.onresult = (e) => {
      this.input.value = e.results[0][0].transcript;
      this.sendMessage();
    };
    this._recognition.onerror = () => this._stopRecording();
    this._recognition.onend = () => this._stopRecording();
  }

  toggleVoiceInput() {
    this._isRecording ? this._recognition.stop() : this._recognition.start();
  }

  _stopRecording() {
    this._isRecording = false;
    this.micBtn?.classList.remove("recording");
    this.input.placeholder = "Ask about elections...";
  }

  openPanel() {
    this.isOpen = true;
    this.panel.classList.add("open");
    this.toggle.classList.add("hidden");
    this.input.focus();
    if (this.messages.children.length === 0) this.clearHistory();
  }

  closePanel() {
    this.isOpen = false;
    this.panel.classList.remove("open");
    this.toggle.classList.remove("hidden");
  }

  _renderMarkdown(text) {
    if (!text) return "";
    const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");
  }

  async sendMessage() {
    const question = this.input.value.trim();
    if (!question || this.isLoading) return;

    this.addUserMessage(question);
    this.input.value = "";
    this.isLoading = true;

    const response = await fetch("/api/assistant/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, language: this.selectedLang, conversationHistory: this.conversationHistory.slice(-6) })
    });

    const data = await response.json();
    if (data.success) {
      this.addBotMessage(data.data.answer, null, true, true);
      this.conversationHistory.push({ role: "assistant", content: data.data.answer });
    }
    this.isLoading = false;
  }

  addUserMessage(text) {
    const div = document.createElement("div");
    div.className = "chat-msg chat-msg-user";
    div.textContent = text;
    this.messages.appendChild(div);
    this._scrollToBottom();
  }

  addBotMessage(text, meta = null, autoSpeak = false, humanTyping = false) {
    const div = document.createElement("div");
    div.className = "chat-msg chat-msg-bot";
    const content = document.createElement("div");
    content.className = "msg-content";
    div.appendChild(content);
    this.messages.appendChild(div);
    
    if (autoSpeak) this.voice.speak(text, this.selectedLang);
    
    if (humanTyping) {
      let idx = 0;
      const tokens = text.split(" ");
      const type = () => {
        if (idx < tokens.length) {
          content.textContent += tokens[idx++] + " ";
          this._scrollToBottom();
          setTimeout(type, 30 + Math.random() * 40);
        } else {
          content.innerHTML = this._renderMarkdown(text);
        }
      };
      type();
    } else {
      content.innerHTML = this._renderMarkdown(text);
      this._scrollToBottom();
    }
  }

  _scrollToBottom() {
    requestAnimationFrame(() => {
      this.messages.scrollTop = this.messages.scrollHeight;
    });
  }

  clearHistory() {
    this.messages.innerHTML = "";
    this.addBotMessage("Namaste! I'm Gnan. How can I help you today?", null, false, true);
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
}

window.AssistantUI = AssistantUI;
