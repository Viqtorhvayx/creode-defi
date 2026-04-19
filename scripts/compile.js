import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const contractsDir = path.join(rootDir, 'contracts');

function findImports(importPath) {
    const fullPath = path.join(contractsDir, importPath);
    try {
        return { contents: fs.readFileSync(fullPath, 'utf8') };
    } catch (e) {
        return { error: 'File not found' };
    }
}

const compile = (filename) => {
    const filePath = path.join(contractsDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const input = {
        language: 'Solidity',
        sources: { [filename]: { content } },
        settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    
    if (output.errors) {
        output.errors.forEach(err => {
            if (err.severity === 'error') {
                console.error(err.formattedMessage);
            } else {
                console.warn(err.formattedMessage);
            }
        });
    }

    if (!output.contracts || !output.contracts[filename]) {
        throw new Error(`Failed to compile ${filename}`);
    }

    const contractName = filename.split('.')[0];
    return output.contracts[filename][contractName];
};

try {
    const xp = compile('CreodeXP.sol');
    const vault = compile('CreodeVault.sol');

    const abis = {
        CreodeXP: xp.abi,
        CreodeVault: vault.abi
    };

    const outputPath = path.join(rootDir, 'frontend', 'src', 'context', 'abis.json');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(abis, null, 2));
    console.log(`ABIs generated successfully in ${outputPath}`);
} catch (error) {
    console.error('Compilation failed:', error.message);
    process.exit(1);
}
