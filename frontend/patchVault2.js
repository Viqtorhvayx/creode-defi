const fs = require('fs');
const filePath = require('path').join(__dirname, 'src', 'components', 'VaultTab.tsx');
let c = fs.readFileSync(filePath, 'utf-8');

// Find the exact broken region: from the Summary Row comment to just before ACTIVE VAULTS MODULE
const START_MARKER = '          {/* Summary Row */}';
const END_MARKER = '      {/* ACTIVE VAULTS MODULE */}';

const startIdx = c.indexOf(START_MARKER);
const endIdx = c.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers. Start:', startIdx, 'End:', endIdx);
  process.exit(1);
}

const replacement = `          {/* Summary Row */}
          <div className="flex flex-col gap-3 w-full mb-6 pt-2">
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Lock Period</span>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{displayLockDays} Days</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Maturity Date</span>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{formattedMaturityDate}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Estimated Earnings</span>
              <span className="text-[13px] font-bold text-[#10B981]">+4.50 {activeToken}</span>
            </div>
          </div>

          {/* Deposit / Withdraw Buttons */}
          <div className="mt-auto pt-4 w-full">
            <button 
              onClick={handleDeposit}
              disabled={isProcessing || isSuccess}
              className={\`w-full h-12 rounded-[8px] text-[15px] font-bold flex items-center justify-center transition-all duration-100 ease-in active:scale-[0.98] tracking-wide shadow-sm relative \${
                isSuccess 
                  ? 'bg-emerald-500 text-white pointer-events-none' 
                  : isProcessing 
                    ? 'bg-[#00A8E8]/80 text-white cursor-not-allowed' 
                    : 'bg-[#00A8E8] hover:bg-[#0090C7] hover:brightness-105 hover:shadow-md text-white'
              }\`}
            >
              {isSuccess && (
                <div className="absolute inset-0 rounded-[8px] bg-emerald-500 animate-ping-once pointer-events-none"></div>
              )}
              
              {isProcessing ? (
                <div className="flex items-center gap-2 z-10">
                  <CircleNotch size={18} weight="bold" className="animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : isSuccess ? (
                <div className="flex items-center gap-2 z-10">
                  <CheckCircle size={18} weight="bold" />
                  <span>Deposited Successfully</span>
                </div>
              ) : (
                <span className="z-10">Deposit to Vault</span>
              )}
            </button>
          </div>

          </div>
        </div>
      </div>

      `;

const fixed = c.substring(0, startIdx) + replacement + END_MARKER + c.substring(endIdx + END_MARKER.length);
fs.writeFileSync(filePath, fixed, 'utf-8');
console.log('Patched summary row, deposit button, and section closers. Total lines:', fixed.split('\n').length);
