# Development Server Management Guide

## Problem: Port 3001 Already in Use

When you see this error:
```
Error: listen EADDRINUSE: address already in use :::3001
```

It means there's already a process running on port 3001.

---

## ✅ SOLUTION 1: Use the Clean Start Script (RECOMMENDED)

I've created a script that automatically kills any existing processes and starts fresh:

```bash
npm run dev:clean
```

**OR directly:**
```bash
./start-dev.sh
```

This script will:
1. ✅ Find any process using port 3001
2. ✅ Kill it automatically
3. ✅ Clean up lingering Next.js processes
4. ✅ Start a fresh dev server

---

## ✅ SOLUTION 2: Manual Cleanup

If you prefer to do it manually:

### Step 1: Find and Kill the Process
```bash
# Find what's using port 3001
lsof -ti:3001

# Kill it (replace PID with the number from above)
kill -9 <PID>
```

**OR use this one-liner:**
```bash
lsof -ti:3001 | xargs kill -9
```

### Step 2: Start the Server
```bash
npm run dev
```

---

## ✅ SOLUTION 3: One-Line Command

Add this to your terminal aliases:

```bash
# Kill port 3001 and start dev server
lsof -ti:3001 | xargs kill -9 2>/dev/null; npm run dev
```

---

## 🔍 Common Scenarios

### Scenario 1: "I closed the terminal but server is still running"
```bash
# Find and kill all Next.js dev processes
pkill -9 -f "next dev"
```

### Scenario 2: "Multiple processes are stuck"
```bash
# Nuclear option - kill everything on port 3001
lsof -ti:3001 | xargs kill -9
pkill -9 -f "next dev"
sleep 2
npm run dev
```

### Scenario 3: "I want to check what's running on port 3001"
```bash
# See detailed info about the process
lsof -i:3001
```

---

## 🚀 Best Practices

### Always Use the Clean Start Script
```bash
# Instead of this:
npm run dev

# Use this:
npm run dev:clean
```

### Check Server Status
```bash
# Is the server running?
curl http://localhost:3001/api/ai/grammar -X OPTIONS

# If you get a response, it's running!
```

### Stop the Server Properly
- Press `Ctrl+C` in the terminal where the server is running
- Then wait 2-3 seconds before restarting

---

## 📋 Quick Reference

| Command | What it does |
|---------|--------------|
| `npm run dev:clean` | **Clean start** (kills old processes first) |
| `npm run dev` | Normal start (may fail if port is busy) |
| `lsof -ti:3001` | Find what's using port 3001 |
| `lsof -ti:3001 \| xargs kill -9` | Kill process on port 3001 |
| `pkill -9 -f "next dev"` | Kill all Next.js dev servers |
| `./start-dev.sh` | Run the clean start script directly |

---

## 🎯 Why This Happens

This error occurs when:
1. You closed the terminal but the server kept running in the background
2. The server crashed but the port wasn't released
3. You're running multiple instances accidentally
4. A previous server process didn't shut down cleanly

**The clean start script solves all of these issues automatically!**

---

## 💡 Pro Tip: Create an Alias

Add this to your `~/.zshrc` or `~/.bashrc`:

```bash
alias dev="cd '/Users/mymac/Downloads/Farisly Ai' && npm run dev:clean"
```

Then you can just type:
```bash
dev
```

From anywhere in your terminal! 🚀

---

## ✅ Verification

After starting the server, verify it's working:

### Test the API
```bash
curl -X POST http://localhost:3001/api/ai/grammar \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}' | python3 -m json.tool
```

**Expected output:**
```json
{
    "success": true,
    "errors": [],
    "originalText": "test"
}
```

### Open Test Page
```bash
open test-grammar-api.html
```

---

## 🆘 Still Having Issues?

If the clean start script doesn't work:

1. **Restart your terminal** - Sometimes environment variables get stuck
2. **Check for multiple Node processes:**
   ```bash
   ps aux | grep node
   ```
3. **Reboot your Mac** - Last resort, but it works!

---

## 📁 Files Created

- ✅ `start-dev.sh` - Clean start script
- ✅ `DEV_SERVER_GUIDE.md` - This guide
- ✅ `package.json` - Added `dev:clean` command

---

**Remember: Always use `npm run dev:clean` for a hassle-free start!** 🎉
