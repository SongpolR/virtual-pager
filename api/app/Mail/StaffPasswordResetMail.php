<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StaffPasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $resetUrl;
    public string $shopName;

    public function __construct(string $resetUrl, string $shopName)
    {
        $this->resetUrl = $resetUrl;
        $this->shopName = $shopName;
    }

    public function build()
    {
        return $this->subject('Reset your staff password')
            ->view('emails.staff-reset')
            ->with(['resetUrl' => $this->resetUrl, 'shopName' => $this->shopName]);
    }
}
