<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StaffInviteMail extends Mailable {
  use Queueable, SerializesModels;
  public string $acceptUrl;
  public string $shopName;

  public function __construct(string $acceptUrl, string $shopName) {
    $this->acceptUrl = $acceptUrl;
    $this->shopName  = $shopName;
  }

  public function build() {
    return $this->subject('You’re invited to join as staff')
      ->view('emails.staff-invite')
      ->with(['acceptUrl' => $this->acceptUrl, 'shopName' => $this->shopName]);
  }
}
