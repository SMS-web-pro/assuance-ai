
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

interface CustomCode {
  id: number;
  name: string;
  code: string;
  location: 'head' | 'body' | 'footer';
}

interface CustomCodesSectionProps {
  customCodes: CustomCode[];
  setCustomCodes: (codes: CustomCode[]) => void;
}

const CustomCodesSection = ({ customCodes, setCustomCodes }: CustomCodesSectionProps) => {
  const [newCode, setNewCode] = useState<{ name: string; code: string; location: 'head' | 'body' | 'footer' }>({ 
    name: '', 
    code: '', 
    location: 'head' 
  });

  const addCustomCode = () => {
    if (newCode.name && newCode.code) {
      setCustomCodes([...customCodes, { ...newCode, id: Date.now() }]);
      setNewCode({ name: '', code: '', location: 'head' });
    }
  };

  const removeCustomCode = (id: number) => {
    setCustomCodes(customCodes.filter(code => code.id !== id));
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Codes Personnalisés</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-700 dark:text-gray-300">Nom</Label>
            <Input
              value={newCode.name}
              onChange={(e) => setNewCode({...newCode, name: e.target.value})}
              placeholder="Nom du code"
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <Label className="text-gray-700 dark:text-gray-300">Emplacement</Label>
            <Select value={newCode.location} onValueChange={(value: 'head' | 'body' | 'footer') => setNewCode({...newCode, location: value})}>
              <SelectTrigger className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectItem value="head" className="text-gray-900 dark:text-white">Head</SelectItem>
                <SelectItem value="body" className="text-gray-900 dark:text-white">Body</SelectItem>
                <SelectItem value="footer" className="text-gray-900 dark:text-white">Footer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label className="text-gray-700 dark:text-gray-300">Code</Label>
          <div className="flex gap-2">
            <Textarea
              value={newCode.code}
              onChange={(e) => setNewCode({...newCode, code: e.target.value})}
              placeholder="Code HTML/CSS/JS"
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
            <Button onClick={addCustomCode} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {customCodes.map((code) => (
            <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{code.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({code.location})</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeCustomCode(code.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomCodesSection;
