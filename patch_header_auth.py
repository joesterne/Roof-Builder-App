import re

with open('src/components/Header.tsx', 'r') as f:
    content = f.read()

# Add User import
content = content.replace("FolderOpen, RotateCcw, QrCode } from 'lucide-react';", "FolderOpen, RotateCcw, QrCode, User, LogOut } from 'lucide-react';")

# Add auth props
content = content.replace(
    "statusMessage: string;",
    "statusMessage: string;\n  user: any;\n  onAuthClick: () => void;\n  onSignOut: () => void;"
)

content = content.replace(
    "statusMessage",
    "statusMessage,\n  user,\n  onAuthClick,\n  onSignOut"
)

# Add login/user button to the far right
auth_button_html = """
          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 ml-1">{user.email}</span>
              <button 
                onClick={onSignOut}
                title="Sign Out"
                className="text-xs flex items-center justify-center bg-gray-800 hover:bg-gray-700 p-1.5 rounded border border-gray-600 transition-colors text-gray-300 hover:text-white"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              title="Sign In / Register"
              className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
"""

content = content.replace("        </div>\n      </div>\n    </header>", auth_button_html)

with open('src/components/Header.tsx', 'w') as f:
    f.write(content)

