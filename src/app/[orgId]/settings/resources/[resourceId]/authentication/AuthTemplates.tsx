"use client";

import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import { Palette } from "lucide-react";

interface AuthTemplatesProps {
  onApplyTemplate: (template: any) => void;
}

const AuthTemplates: React.FC<AuthTemplatesProps> = ({ onApplyTemplate }) => {
  const templates = [
    {
      name: "Romantic Wedding - Juliane & Johannes",
      preview: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      data: {
        authCustomEnabled: true,
        authCustomTitle: "Willkommen",
        authCustomDescription: "Bitte melden Sie sich an, um Zugang zu unserem besonderen Tag zu erhalten",
        authCustomBackground: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        authCustomHTML: `<div class="wedding-header" style="text-align: center; margin-bottom: 20px;"><div style="font-family: 'Dancing Script', cursive; font-size: 2.5rem; color: #8b4513; margin-bottom: 10px;">Juliane & Johannes</div><div style="font-size: 1.1rem; color: #a0522d; letter-spacing: 2px;">Unser besonderer Tag</div><div style="font-size: 1.5rem; color: #d2691e; margin: 10px 0;">♥ ♥ ♥</div></div>`,
        authCustomCSS: `.resource-auth-container { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); } .auth-card-enhanced { background: rgba(255, 255, 255, 0.95); border: 2px solid rgba(255, 255, 255, 0.8); border-radius: 20px; } .auth-button-enhanced { background: linear-gradient(135deg, #ff6b6b, #ffa726); border-radius: 12px; }`
      }
    },
    {
      name: "Corporate Blue", 
      preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      data: {
        authCustomEnabled: true,
        authCustomTitle: "Secure Corporate Portal",
        authCustomDescription: "Access your corporate resources securely",
        authCustomBackground: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        authCustomCSS: `.auth-card-enhanced { background: rgba(255, 255, 255, 0.95); border-radius: 16px; }`
      }
    },
    {
      name: "Modern Dark",
      preview: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
      data: {
        authCustomEnabled: true,
        authCustomTitle: "Dark Portal",
        authCustomDescription: "Sleek and modern authentication",
        authCustomBackground: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
        authCustomCSS: `.auth-card-enhanced { background: rgba(52, 73, 94, 0.9); color: white; }`
      }
    },
    {
      name: "Minimalist",
      preview: "#f8f9fa", 
      data: {
        authCustomEnabled: true,
        authCustomTitle: "Clean Access",
        authCustomDescription: "Simple and elegant authentication",
        authCustomBackground: "#f8f9fa",
        authCustomCSS: `.auth-card-enhanced { background: white; border: 1px solid #e9ecef; }`
      }
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Quick Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div
                className="w-full h-16 rounded border"
                style={{ background: template.preview }}
              ></div>
              <div>
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-gray-600 mb-2">
                  {template.data.authCustomDescription}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyTemplate(template.data)}
                  className="w-full"
                >
                  Apply Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthTemplates;
