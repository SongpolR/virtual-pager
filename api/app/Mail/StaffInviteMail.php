<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StaffInviteMail extends Mailable
{
  use Queueable, SerializesModels;

  public string $acceptUrl;
  public string $shopName;
  public string $shopCode;

  // Optional / themed variables
  public string $appName;
  public string $appSubtitle;
  public int $expireHours;
  public ?string $supportEmail;

  /**
   * Create a new message instance.
   */
  public function __construct(
    string $acceptUrl,
    string $shopName,
    string $shopCode,
    array $options = []
  ) {
    $this->acceptUrl = $acceptUrl;
    $this->shopName  = $shopName;
    $this->shopCode  = $shopCode;

    // Defaults (safe for all environments)
    $this->appName     = $options['appName']     ?? config('app.name');
    $this->appSubtitle = $options['appSubtitle'] ?? config('app.fullname');
    $this->expireHours = $options['expireHours'] ?? 72;
    $this->supportEmail = $options['supportEmail'] ?? config('app.support_email');
  }

  /**
   * Build the message.
   */
  public function build()
  {
    return $this
      ->subject("You're invited to join {$this->shopName}")
      ->view('emails.staff-invite')
      ->with([
        'acceptUrl'   => $this->acceptUrl,
        'shopName'    => $this->shopName,
        'shopCode'    => $this->shopCode,
        'appName'     => $this->appName,
        'appSubtitle' => $this->appSubtitle,
        'expireHours' => $this->expireHours,
        'supportEmail' => $this->supportEmail,
      ]);
  }
}
