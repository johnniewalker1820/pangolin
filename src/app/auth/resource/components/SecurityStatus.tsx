import React from 'react';
import { Shield, Lock, CheckCircle } from 'lucide-react';

interface SecurityStatusProps {
  isSecure?: boolean;
  connectionType?: 'https' | 'http';
  authMethod?: 'password' | 'pincode' | 'sso' | 'whitelist';
}

const SecurityStatus: React.FC<SecurityStatusProps> = ({ 
  isSecure = true, 
  connectionType = 'https',
  authMethod = 'password'
}) => {
  const getSecurityLevel = () => {
    if (!isSecure || connectionType === 'http') return 'low';
    if (authMethod === 'sso') return 'high';
    if (authMethod === 'password' || authMethod === 'pincode') return 'medium';
    return 'medium';
  };

  const securityLevel = getSecurityLevel();

  const getSecurityColor = () => {
    switch (securityLevel) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  const getSecurityIcon = () => {
    switch (securityLevel) {
      case 'high': return <Shield className="w-4 h-4" />;
      case 'medium': return <Lock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const getSecurityText = () => {
    switch (securityLevel) {
      case 'high': return 'High Security';
      case 'medium': return 'Secure Connection';
      case 'low': return 'Basic Security';
      default: return 'Secure';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${getSecurityColor()}`}>
      {getSecurityIcon()}
      <span>{getSecurityText()}</span>
    </div>
  );
};

export default SecurityStatus;
