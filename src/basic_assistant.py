from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

class BasicAssistant:
    def __init__(self):
        # Load a small model that Railway can handle
        self.tokenizer = AutoTokenizer.from_pretrained(
            "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        )

        self.model = AutoModelForCausalLM.from_pretrained(
            "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True
        )

        self.history = []

    def chat(self, message):
        # Add user message to history
        self.history.append({"role": "user", "content": message})

        # Build a prompt from history
        prompt = ""
        for turn in self.history:
            role = turn["role"]
            txt = turn["content"]
            prompt += f"{role}: {txt}\n"
        prompt += "assistant:"

        inputs = self.tokenizer(prompt, return_tensors="pt")

        # Generate a short response to keep Railway fast
        output_ids = self.model.generate(
            **inputs,
            max_new_tokens=120,
            do_sample=False,     # deterministic, faster
            use_cache=False      # avoids the DynamicCache bug entirely
        )

        reply = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)

        # Extract only the assistant's final message
        reply = reply.split("assistant:")[-1].strip()

        self.history.append({"role": "assistant", "content": reply})
        return reply
