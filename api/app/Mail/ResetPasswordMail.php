<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
  use Queueable, SerializesModels;

  public string $resetUrl;
  public int $expiresMinutes;
  public string $appName;

  public function __construct(
    string $resetUrl,
    array $options = []
  ) {
    $this->resetUrl = $resetUrl;
    $this->expiresMinutes = $options['expiresMinutes'] ?? 60;
    $this->appName     = $options['appName']     ?? config('app.name');
  }

  public function build()
  {
    return $this
      ->subject(__('Reset your password'))
      ->view('emails.reset-password')
      ->with([
        'resetUrl'       => $this->resetUrl,
        'expiresMinutes' => $this->expiresMinutes,
        'appName'        => $this->appName,
      ]);
  }
}
