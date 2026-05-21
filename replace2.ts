import fs from 'fs';

const files = [
  'src/pages/LandingPage.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/HowToPlay.tsx',
  'src/pages/LeagueHub.tsx'
];

files.forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  // Remove import
  code = code.replace(/import \{ Button \} from '@\/components\/ui\/button';\n*/g, '');
  
  // Replace <Button> and </Button> with <button> and </button>
  code = code.replace(/<Button/g, '<button');
  code = code.replace(/<\/Button>/g, '</button>');
  
  // Remove size="lg"
  code = code.replace(/size="lg"\s*/g, '');

  // Remove variant="outline"
  code = code.replace(/variant="outline"\s*/g, '');

  fs.writeFileSync(f, code);
});
