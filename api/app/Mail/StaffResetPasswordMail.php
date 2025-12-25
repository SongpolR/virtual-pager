<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StaffResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $resetUrl;
    public string $shopName;
    public string $shopCode;

    // Optional / themed variables
    public string $appName;
    public string $appSubtitle;
    public string $logoUrl;
    public int $expiresMinutes;
    public ?string $supportEmail;
    public ?string $footerNote;

    public function __construct(
        string $resetUrl,
        string $shopName,
        string $shopCode,
        array $options = []
    ) {
        $this->resetUrl = $resetUrl;
        $this->shopName  = $shopName;
        $this->shopCode  = $shopCode;

        // Defaults (safe for all environments)
        $this->appName     = $options['appName']     ?? config('app.name');
        $this->appSubtitle = $options['appSubtitle'] ?? 'Virtual Pager';
        $this->logoUrl     = $options['logoUrl']     ?? (config('app.url') . '/app-icon.png');
        $this->expiresMinutes = $options['expiresMinutes'] ?? 60;
        $this->supportEmail = $options['supportEmail'] ?? null;
        $this->footerNote   = $options['footerNote'] ?? null;
    }

    public function build()
    {
        $subject = "Reset your staff password";

        return $this->subject($subject)
            ->view('emails.staff-reset-password')
            ->with([
                'resetUrl'        => $this->resetUrl,
                'shopName'        => $this->shopName,
                'shopCode'    => $this->shopCode,
                'supportEmail'    => $this->supportEmail,
                'appName'         => $this->appName ?? config('app.name'),
                'logoUrl'         => $this->logoUrl ?? (rtrim(config('app.url'), '/') . '/app-icon.png'),
                'expiresMinutes'  => $this->expiresMinutes,
            ]);
    }
}
