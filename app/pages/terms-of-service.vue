<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="mb-6 text-2xl font-bold">Terms of Service</h1>
    <p class="mt-0 text-sm opacity-80">Effective date: August 12, 2025</p>

    <p class="mt-6">
      These Terms of Service (the “Terms”) govern your access to and use of
      <strong>tokenly.tools</strong> (the “Service”). By accessing or using the Service,
      you agree to be bound by these Terms. If you do not agree, do not use the Service.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Who we are</h2>
    <p class="mt-4">
      “We”, “us”, and “our” refer to tokenly.tools. For questions about these Terms,
      contact
      <a class="underline underline-offset-2" href="mailto:support@tokenly.tools"
        >support@tokenly.tools</a
      >.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Description of the Service</h2>
    <p class="mt-4">
      The Service provides non-custodial tools for interacting with EVM-compatible
      blockchains, currently including Core mainnet and test networks. Features include
      (as available):
    </p>
    <ul class="mt-4 list-disc space-y-2 pl-6">
      <li>
        <strong>Token minter</strong>: deploy or create ERC-20 tokens via smart contracts.
      </li>
      <li><strong>Locker</strong>: time-lock ERC-20 tokens using on-chain contracts.</li>
      <li>
        <strong>Multisender</strong>: batch-send native assets or ERC-20 tokens to many
        recipients.
      </li>
    </ul>
    <p class="mt-4">We may add, change, or remove features at any time.</p>

    <h2 class="mt-10 text-xl font-semibold">Non-custodial service</h2>
    <ul class="mt-4 list-disc space-y-2 pl-6">
      <li>
        You connect a self-custodial wallet to use the Service. We do not hold, control,
        or have access to your private keys, and we do not custody user funds.
      </li>
      <li>
        Transactions you authorize are executed on-chain and are irreversible once
        confirmed.
      </li>
      <li>
        You are solely responsible for safeguarding your wallet, managing
        approvals/allowances, and reviewing transactions before signing.
      </li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">Third-party services and infrastructure</h2>
    <ul class="mt-4 list-disc space-y-2 pl-6">
      <li>
        <strong>Hosting</strong>: The Service runs on Cloudflare Pages/Workers with a
        Cloudflare D1 database via Prisma. Cloudflare may process technical data to
        deliver the Service and protect against abuse.
      </li>
      <li>
        <strong>Wallet connection</strong>: We use Reown AppKit (WalletConnect Cloud
        infrastructure). AppKit analytics is disabled in our configuration. Your chosen
        wallet provider may process data per its own policy.
      </li>
      <li>
        <strong>RPC and explorers</strong>: The Service may query RPC endpoints (e.g.,
        rpc.coredao.org, rpc.test2.btcs.network) and link to block explorers (e.g.,
        CoreScan). These services may receive your IP address and request details.
      </li>
    </ul>
    <p class="mt-4">
      Your use of third-party services is governed by their terms and policies. We are not
      responsible for third-party services.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Assumption of risk</h2>
    <ul class="mt-4 list-disc space-y-2 pl-6">
      <li>
        You acknowledge the inherent risks of using blockchain technology, including smart
        contract vulnerabilities, malicious tokens, loss of private keys, irreversible
        transactions, market volatility, and regulatory changes.
      </li>
      <li>
        Smart contracts you interact with (including minting, locking, and multisending)
        execute autonomously according to their code. You are responsible for verifying
        contract addresses and understanding contract behavior before use.
      </li>
      <li>
        We do not provide financial, investment, tax, or legal advice. Content on the
        Service is for informational purposes only.
      </li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">Fees, gas, and taxes</h2>
    <ul class="mt-4 list-disc space-y-2 pl-6">
      <li>
        You are responsible for all network fees (gas) and any applicable taxes arising
        from your use of the Service.
      </li>
      <li>
        Where a feature requires ERC-20 allowances, you are responsible for granting,
        monitoring, and revoking approvals.
      </li>
      <li>
        For multisend operations, you are responsible for the accuracy of recipient
        addresses and amounts. The Service does not recover assets sent to incorrect
        addresses.
      </li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">Privacy</h2>
    <p class="mt-4">
      Our data practices are described in our
      <NuxtLink class="underline underline-offset-2" to="/privacy-policy"
        >Privacy Policy</NuxtLink
      >. By using the Service, you agree to that policy.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Acceptable use</h2>
    <p class="mt-4">When using the Service, you agree not to:</p>
    <ul class="mt-4 list-disc space-y-2 pl-6">
      <li>Violate any applicable laws or regulations.</li>
      <li>
        Use the Service for fraud, money laundering, sanctions evasion, or other unlawful
        acts.
      </li>
      <li>Exploit, attack, or disrupt the Service or underlying networks.</li>
      <li>Infringe intellectual property or privacy rights.</li>
      <li>Upload or distribute malicious code.</li>
      <li>Scrape or misuse the Service in a manner that degrades availability.</li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">Intellectual property</h2>
    <p class="mt-4">
      The Service’s website content, branding, and UI are owned by us or our licensors and
      are protected by intellectual property laws. Open-source components are licensed
      under their respective licenses.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Changes and availability</h2>
    <p class="mt-4">
      We may modify, suspend, or discontinue the Service (in whole or part) at any time
      without notice. We are not liable for any unavailability or changes.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Disclaimer of warranties</h2>
    <p class="mt-4">
      THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND,
      WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. YOUR
      USE OF THE SERVICE AND ANY SMART CONTRACTS OR THIRD-PARTY SERVICES IS AT YOUR SOLE
      RISK.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Limitation of liability</h2>
    <p class="mt-4">
      TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE BE LIABLE FOR ANY
      INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY
      LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR
      RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO
      THE SERVICE WILL NOT EXCEED THE AMOUNT YOU PAID US (IF ANY) FOR THE SERVICE IN THE
      12 MONTHS PRECEDING THE CLAIM.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Indemnification</h2>
    <p class="mt-4">
      You agree to defend, indemnify, and hold us harmless from and against any claims,
      damages, liabilities, costs, and expenses (including reasonable attorneys’ fees)
      arising from your use of the Service or violation of these Terms.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Termination</h2>
    <p class="mt-4">
      We may suspend or terminate your access to the Service at any time, with or without
      notice, for any reason, including if we believe you have violated these Terms. Upon
      termination, the sections that by their nature should survive will survive (e.g.,
      IP, disclaimers, limits of liability, indemnification, governing law).
    </p>

    <h2 class="mt-10 text-xl font-semibold">Governing law and disputes</h2>
    <p class="mt-4">
      These Terms are governed by the laws applicable in our principal place of business,
      without regard to conflict of laws principles. Where permitted by law, you and we
      agree to resolve disputes through informal negotiations first and, if unresolved,
      through courts with competent jurisdiction in that location.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Changes to these Terms</h2>
    <p class="mt-4">
      We may update these Terms from time to time. We will post the updated version here
      and update the effective date above. Your continued use of the Service constitutes
      acceptance of the updated Terms.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Contact</h2>
    <p class="mt-4">
      Questions about these Terms? Email
      <a class="underline underline-offset-2" href="mailto:support@tokenly.tools"
        >support@tokenly.tools</a
      >.
    </p>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Terms of Service – tokenly.tools',
  ogTitle: 'Terms of Service – tokenly.tools',
  description:
    'Terms governing the use of tokenly.tools, a non-custodial toolkit for Core networks (minting, locker, multisender).',
  ogDescription:
    'Terms governing the use of tokenly.tools, a non-custodial toolkit for Core networks (minting, locker, multisender).'
})
</script>
