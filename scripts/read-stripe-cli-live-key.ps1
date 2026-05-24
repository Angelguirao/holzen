Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class StripeCredRead {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }
    [DllImport("advapi32", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32", SetLastError = true)]
    public static extern bool CredFree(IntPtr cred);
}
"@

$ptr = [IntPtr]::Zero
if (-not [StripeCredRead]::CredRead("keyring:StripeCLI:default.live_mode_api_key", 1, 0, [ref]$ptr)) {
    Write-Error "Stripe live key not found in Windows Credential Manager. Run: npm run stripe:login"
    exit 1
}

$cred = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][StripeCredRead+CREDENTIAL])
$bytes = New-Object byte[] $cred.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
[StripeCredRead]::CredFree($ptr) | Out-Null
Write-Output ([Text.Encoding]::UTF8.GetString($bytes))
