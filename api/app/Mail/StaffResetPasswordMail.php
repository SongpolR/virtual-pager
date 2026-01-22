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
    public int $expiresMinutes;

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
        $this->appSubtitle = $options['appSubtitle'] ?? config('app.fullname');
        $this->expiresMinutes = $options['expiresMinutes'] ?? 60;
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
                'appName'         => $this->appName,
                'appSubtitle' => $this->appSubtitle,
                'expiresMinutes'  => $this->expiresMinutes,
            ]);
    }
}
