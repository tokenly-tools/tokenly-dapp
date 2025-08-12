<template>
  <div class="mx-auto max-w-3xl space-y-6 px-4 py-10 text-base leading-7">
    <h1 class="mb-6 text-2xl font-bold">Privacy Policy</h1>
    <p class="text-sm opacity-80">Effective date: August 12, 2025</p>

    <p>
      This Privacy Policy explains how we collect, use, and share information when you use
      <strong>tokenly.tools</strong> (the “Service”). We designed the Service to minimize
      data collection while enabling blockchain interactions. By using the Service, you
      agree to this Policy.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Who we are</h2>
    <p>
      “We”, “us”, or “our” refers to tokenly.tools. For questions or requests about this
      Policy, contact us at
      <a href="mailto:privacy@tokenly.tools">privacy@tokenly.tools</a>.
    </p>

    <h2 class="mt-10 text-xl font-semibold">What we collect</h2>
    <p>We aim to collect only what is necessary to operate the Service.</p>
    <ul class="list-disc space-y-2 pl-6">
      <li>
        <strong>Wallet information</strong>: public wallet address, connected network ID,
        transaction hashes and on-chain data you submit or read via the Service. We never
        have access to your private keys and do not custody funds.
      </li>
      <li>
        <strong>Optional account data</strong>: if you choose to provide it (e.g., forms
        or admin tools), we may store your name and email. Our database schema includes a
        minimal <code>User</code> record with <code>email</code> and optional
        <code>name</code> fields.
      </li>
      <li>
        <strong>Technical data</strong>: Cloudflare (our hosting provider) may process IP
        address, request headers, and basic logs for security and performance. We may also
        keep server-side logs of application errors.
      </li>
      <li>
        <strong>Local storage/session data</strong>: your browser may store ephemeral data
        (e.g., wallet connection session) to keep you connected between page loads. We do
        not set tracking cookies.
      </li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">How we use information</h2>
    <ul class="list-disc space-y-2 pl-6">
      <li>
        <strong>Provide the Service</strong>: enable wallet connection, read/write smart
        contracts, and display on-chain data.
      </li>
      <li>
        <strong>Security and abuse prevention</strong>: detect, prevent, and investigate
        harmful or unauthorized activity.
      </li>
      <li>
        <strong>Support and communication</strong>: respond to inquiries you initiate. We
        do not send marketing emails.
      </li>
      <li>
        <strong>Compliance</strong>: comply with applicable laws and enforce our terms.
      </li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">Legal bases (EEA/UK)</h2>
    <ul class="list-disc space-y-2 pl-6">
      <li>
        <strong>Performance of a contract</strong>: to provide the Service you request.
      </li>
      <li><strong>Legitimate interests</strong>: to secure and improve the Service.</li>
      <li>
        <strong>Consent</strong>: for optional features where required by law. You can
        withdraw consent at any time.
      </li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">Where and how we store data</h2>
    <ul class="list-disc space-y-2 pl-6">
      <li>
        <strong>Hosting</strong>: The Service runs on Cloudflare Pages/Workers (Nitro
        preset) with a Cloudflare D1 database via Prisma. Data may be processed across
        Cloudflare’s global network. See Cloudflare’s policies for details on data
        locality and sub-processors.
      </li>
      <li>
        <strong>Database</strong>: We store minimal application data in Cloudflare D1
        (e.g., optional user records). Blockchain-related data is generally public and
        stored on the relevant networks, not by us.
      </li>
      <li>
        <strong>Retention</strong>: We retain data only as long as necessary for the
        purposes described above and to comply with legal obligations. You may request
        deletion of optional account data.
      </li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">Third parties and disclosures</h2>
    <ul class="list-disc space-y-2 pl-6">
      <li>
        <strong>Cloudflare</strong>: We use Cloudflare Pages/Workers and D1. Cloudflare
        may process technical data to deliver the Service and protect against abuse.
      </li>
      <li>
        <strong>Wallet connection (AppKit / WalletConnect Cloud)</strong>: We use Reown
        AppKit (WalletConnect infrastructure) to connect wallets. AppKit analytics is
        disabled in our configuration. Your chosen wallet provider may process data per
        its own policy.
      </li>
      <li>
        <strong>RPC endpoints and block explorers</strong>: Interactions may query
        blockchain RPC endpoints for Core networks (e.g., <code>rpc.coredao.org</code>,
        <code>rpc.test2.btcs.network</code>) and link to block explorers (e.g., CoreScan).
        These services may receive your IP address and request details.
      </li>
      <li>
        <strong>Law enforcement/Compliance</strong>: We may disclose information when
        required by law.
      </li>
      <li>
        <strong>No sale</strong>: We do not sell your personal information or share it for
        cross-context behavioral advertising.
      </li>
    </ul>

    <h2 class="mt-10 text-xl font-semibold">Cookies and local storage</h2>
    <p>
      We do not use analytics cookies. Your wallet session may be stored in local storage
      to maintain connection state. Cloudflare may set security cookies necessary to
      operate the Service.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Your rights</h2>
    <p>
      Depending on your location, you may have rights to access, correct, delete, or
      restrict processing of your personal data, and to object to certain processing. You
      may also have the right to data portability and to lodge a complaint with a
      supervisory authority. To exercise your rights, contact
      <a href="mailto:privacy@tokenly.tools">privacy@tokenly.tools</a>.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Children’s privacy</h2>
    <p>
      The Service is not directed to children under 16. If you believe a child provided
      personal data, contact us to request deletion.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Changes to this Policy</h2>
    <p>
      We may update this Policy from time to time. We will post the updated version here
      and update the effective date above. Your continued use of the Service constitutes
      acceptance of the updated Policy.
    </p>

    <h2 class="mt-10 text-xl font-semibold">Contact</h2>
    <p>
      For privacy questions or requests, email
      <a href="mailto:privacy@tokenly.tools">privacy@tokenly.tools</a>.
    </p>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Privacy Policy – tokenly.tools',
  ogTitle: 'Privacy Policy – tokenly.tools',
  description:
    'How tokenly.tools uses and protects your data when connecting wallets and interacting with Core networks.',
  ogDescription:
    'How tokenly.tools uses and protects your data when connecting wallets and interacting with Core networks.'
})
</script>
