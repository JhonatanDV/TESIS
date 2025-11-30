"""
Script para listar modelos disponibles de Gemini
"""
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    print("Modelos disponibles en Gemini:\n")
    
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✅ {model.name}")
            print(f"   Descripción: {model.description}")
            print(f"   Métodos: {', '.join(model.supported_generation_methods)}")
            print()
else:
    print("❌ No se encontró GEMINI_API_KEY")
