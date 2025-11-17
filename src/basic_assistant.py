from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

class BasicAssistant:
    def __init__(self):
        # Load tokenizer for Phi-3. This turns text <-> tokens.
        self.tokenizer = AutoTokenizer.from_pretrained(
            "microsoft/Phi-3-mini-4k-instruct",
            trust_remote_code=True
        )

        # Load the Phi-3 model (CPU-friendly).
        self.model = AutoModelForCausalLM.from_pretrained(
            "microsoft/Phi-3-mini-4k-instruct",
            trust_remote_code=True,
            torch_dtype=torch.bfloat16,   # More efficient on CPU
            device_map="cpu"              # Force CPU usage
        )

        # Store conversation history (optional memory)
        self.history = []

    def format_prompt(self, user_input):
        """
        Formats the prompt using an instruction style.
        Phi-3 is an INSTRUCT model, which means it responds better
        when the input is structured clearly.

        You can modify this prompt style later to tune behavior.
        """
        system_prompt = "You are a helpful AI assistant."
        
        # Add previous messages to maintain context (light memory)
        conversation_text = ""
        for item in self.history:
            conversation_text += f"User: {item['user']}\nAssistant: {item['assistant']}\n"

        # Add the new message from the user
        conversation_text += f"User: {user_input}\nAssistant:"

        # Full formatted prompt
        return system_prompt + "\n\n" + conversation_text

    def chat(self, user_input):
        """
        Generates a response using the Phi-3 model.
        """
        # Format the input for Phi-3 instruct style
        prompt = self.format_prompt(user_input)

        # Tokenize the input
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt"
        )

        # Generate output tokens (response)
        output_ids = self.model.generate(
            **inputs,
            max_length=512,
            temperature=0.2,  # Lower temperature = less randomness
            top_p=0.9,        # Controls sampling; 1.0 = more random
            do_sample=True    # Enables creative sampling
        )

        # Decode tokens back into text
        full_output = self.tokenizer.decode(
            output_ids[0],
            skip_special_tokens=True
        )

        # Extract only the assistant's part (everything after "Assistant:")
        if "Assistant:" in full_output:
            reply = full_output.split("Assistant:")[-1].strip()
        else:
            reply = full_output.strip()

        # Save the exchange to the history memory
        self.history.append({
            "user": user_input,
            "assistant": reply
        })

        return reply
