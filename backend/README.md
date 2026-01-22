# Backend Setup Instructions

## ⚠️ Critical Requirement: Python Version
The AI libraries used (TensorFlow, DeepFace) **do not support Python 3.14** yet.
You **must** use **Python 3.10** or **Python 3.11**.

### Step 1: Install Python 3.11
Open a PowerShell as Administrator and run:
```powershell
winget install Python.Python.3.11
```
*Or download it from python.org.*

### Step 2: Recreate Virtual Environment
Once Python 3.11 is installed, run these commands in your `backend` folder:

```powershell
# 1. Delete the existing incompatible venv
Remove-Item -Recurse -Force venv

# 2. Create a new venv using Python 3.11 specific launcher
py -3.11 -m venv venv

# 3. Activate the new venv
.\venv\Scripts\Activate

# 4. Install dependencies
pip install -r requirements.txt
```

### Step 3: Run the Server
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
