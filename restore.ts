import fs from 'fs';

const files = [
  'src/pages/LandingPage.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/HowToPlay.tsx',
  'src/pages/LeagueHub.tsx'
];

files.forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  // Add import if not present
  if (!code.includes('import { Button }')) {
    code = code.replace(/import \{.*?\} from 'lucide-react';\n/g, match => match + "import { Button } from '@/components/ui/button';\n");
    // fallback if lucide-react not present
    if (!code.includes('@/components/ui/button')) {
        code = "import { Button } from '@/components/ui/button';\n" + code;
    }
  }
  
  // Replace <button> with <Button> and </button> with </Button>
  code = code.replace(/<button/g, '<Button');
  code = code.replace(/<\/button>/g, '</Button>');
  
  // size="lg" was removed previously, let's restore it in LandingPage
  if (f.includes('LandingPage')) {
     code = code.replace(/<Button\n\s*type="submit"\n\s*className="h-14/g, '<Button size="lg"\ntype="submit"\nclassName="h-14');
  }

  fs.writeFileSync(f, code);
});
