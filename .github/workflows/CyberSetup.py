import os
import subprocess
import webbrowser

# רשימת פקודות התקנה
tools = {
    "Python": "python",
    "Git": "git --version",
    "Nmap": "nmap --version",
    "Wireshark": "wireshark"
}

def check_tool(name, command):
    try:
        subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"[✓] {name} already installed.")
    except Exception:
        print(f"[X] {name} not found. Please install it manually.")

print("\n🚀 Cyber Setup Start\n")
for name, cmd in tools.items():
    check_tool(name, cmd)

print("\n📦 Installing Python packages...")
os.system("pip install requests scapy python-nmap colorama gradio")

print("\n🧠 Launching AI Dashboard...")
code = '''
import gradio as gr
def talk_to_ai(x): return "🤖: " + x[::-1]
gr.Interface(fn=talk_to_ai, inputs="text", outputs="text").launch()
'''
with open("ai_dashboard.py", "w", encoding="utf-8") as f:
    f.write(code)

subprocess.Popen(["python", "ai_dashboard.py"])
